'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RecordItem, RecordCategory } from '@/types';
import {
  CMOTab,
  RidoRecord,
  RidoStatus,
  PIAGLocationRecord,
  CMOActivityRecord,
} from '@/types/cmo';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import RidoModal from './RidoModal';
import PIAGModal from './PIAGModal';
import CMOActivityModal from './CMOActivityModal';
import TacticalMap, { TacticalLink } from './TacticalMap';
import {
  Globe,
  Scale,
  Crosshair,
  HeartHandshake,
  Users,
  MapPin,
  Compass,
  Navigation,
  Target,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Search,
  Plus,
  RefreshCw,
  Table,
  LayoutGrid,
  Edit,
  Trash2,
  Copy,
  Check,
  ShieldAlert,
  Building2,
  FileText,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CMOCellWorkspaceProps {
  records?: RecordItem[];
  onSelectRecord?: (record: RecordItem) => void;
  onOpenCreate?: (category?: RecordCategory) => void;
  onSaveRecord?: (record: Partial<RecordItem>) => Promise<void> | void;
  onDeleteRecord?: (id: string) => Promise<void> | void;
  onRefreshData?: () => Promise<void> | void;
  dutyOfficer?: string;
  callsign?: string;
}

export const INITIAL_PIAG_RECORDS: PIAGLocationRecord[] = [
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c81',
    group_name: 'MILF — 105th Base Command',
    commander_leader: 'Commander Jack / Ting Sinsuat',
    affiliated_politician_faction: 'Former Mayoralty candidate / Municipal Boss',
    estimated_strength: '15-20 armed personnel',
    total_est_firearms: '12 (8x M16, 2x M14, 1x M203, 1x Cal .45)',
    firearms_inventory: '12 (8x M16, 2x M14, 1x M203, 1x Cal .45)',
    province: 'Maguindanao del Sur',
    municipality: 'Datu Piang (Dulawan)',
    barangay: 'Poblacion',
    purok_sitio: 'Sitio Riverside',
    address: 'Sitio Riverside, Poblacion, Datu Piang (Dulawan), Maguindanao del Sur',
    mgrs: '51NXH6659745322',
    lat: 6.9536,
    lng: 124.4756,
    status: 'Active',
    threat_level: 'critical',
    notes: 'Staging element active along river crossing. Surveillance reports indicate mobilization for localized election security intimidation.',
    remarks: 'Staging element active along river crossing. Surveillance reports indicate mobilization for localized election security intimidation.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d92',
    group_name: 'MNLF — Lupah Sug Force',
    commander_leader: 'Commander Abdulradzak / Kuyo Aliman',
    affiliated_politician_faction: 'Provincial Board & Tayuan Faction Alliance',
    estimated_strength: '25-30 armed personnel',
    total_est_firearms: '22 (14x M16, 5x M14, 2x M203, 1x Ultimax 100 LMG)',
    firearms_inventory: '22 (14x M16, 5x M14, 2x M203, 1x Ultimax 100 LMG)',
    province: 'Maguindanao del Sur',
    municipality: 'Nabalawag',
    barangay: 'Brgy Olandang',
    purok_sitio: 'Sitio Bentad',
    address: 'Sitio Bentad, Brgy Olandang, Nabalawag, Maguindanao del Sur',
    mgrs: '51NXH6771379711',
    lat: 7.0515,
    lng: 124.5184,
    status: 'Active',
    threat_level: 'high',
    notes: 'Previously engaged in territorial dispute encounter in Sitio Bentad. Continuous monitoring by CMO Civil Relations service.',
    remarks: 'Previously engaged in territorial dispute encounter in Sitio Bentad. Continuous monitoring by CMO Civil Relations service.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c3d4e5f6-a1b2-4c3d-ae4f-5a6b7c8d9e03',
    group_name: 'MILF — 118th Base Command',
    commander_leader: 'Field Cmdr Ebrahim Usman @Bords / Badrudin Angkad',
    affiliated_politician_faction: 'Hon. Esmael Tayuan / SGA Coalition',
    estimated_strength: '15-20 armed combatants',
    total_est_firearms: '18 (11x M16, 3x M14, 2x M203, 2x Cal .50 Barrett)',
    firearms_inventory: '18 (11x M16, 3x M14, 2x Cal .50 Barrett, 2x M203)',
    province: 'Maguindanao del Sur',
    municipality: 'Shariff Saydona Mustapha',
    barangay: 'Datu Bakal',
    purok_sitio: 'Sitio Bakal Proper',
    address: 'Sitio Bakal Proper, Datu Bakal, Shariff Saydona Mustapha, Maguindanao del Sur',
    mgrs: '51NXH7120068400',
    lat: 6.9500,
    lng: 124.5200,
    status: 'Monitored',
    threat_level: 'high',
    notes: 'Maintains armed presence near marsh perimeter. Dialogue facilitated through Coordinating Committee on the Cessation of Hostilities (CCCH).',
    remarks: 'Maintains armed presence near marsh perimeter. Dialogue facilitated through Coordinating Committee on the Cessation of Hostilities (CCCH).',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd4e5f6a1-b2c3-4d4e-bf5a-6b7c8d9e0f14',
    group_name: 'MNLF — Paglas Defense Contingent',
    commander_leader: 'Ustadz Wahab / Datu Ronnie',
    affiliated_politician_faction: 'Municipal Executive Clan Alliance',
    estimated_strength: '10-15 combatants',
    total_est_firearms: '10 (6x M16, 2x Garand, 2x .45 pistols)',
    firearms_inventory: '10 (6x M16, 2x Garand, 2x .45 pistols)',
    province: 'Maguindanao del Sur',
    municipality: 'Datu Paglas',
    barangay: 'Poblacion',
    purok_sitio: 'Compound Alpha',
    address: 'Compound Alpha, Poblacion, Datu Paglas, Maguindanao del Sur',
    mgrs: '51NYG0598964012',
    lat: 6.7450,
    lng: 124.8600,
    status: 'Monitored',
    threat_level: 'medium',
    notes: 'Defensive perimeter security around municipal estate. Low offensive posture recorded during recent intelligence sweep.',
    remarks: 'Defensive perimeter security around municipal estate. Low offensive posture recorded during recent intelligence sweep.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function CMOCellWorkspace({
  records = [],
  onSelectRecord,
  onOpenCreate,
  onSaveRecord,
  onDeleteRecord,
  onRefreshData,
  dutyOfficer = 'Lt. Carlos Delgado',
  callsign = 'HARMONY-01',
}: CMOCellWorkspaceProps) {
  // ── Tab State: RIDO (default), PIAGs location, CMO activities ─────────────
  const [activeTab, setActiveTab] = useState<CMOTab>('rido');

  // ── RIDO State ─────────────────────────────────────────────────────────────
  const [ridoRecords, setRidoRecords] = useState<RidoRecord[]>([]);
  const [isRidoModalOpen, setIsRidoModalOpen] = useState(false);
  const [editingRido, setEditingRido] = useState<RidoRecord | null>(null);
  const [ridoSearch, setRidoSearch] = useState('');
  const [ridoStatusFilter, setRidoStatusFilter] = useState<string>('all');
  const [ridoProvinceFilter, setRidoProvinceFilter] = useState<string>('all');
  const [ridoViewMode, setRidoViewMode] = useState<'table' | 'cards'>('table');
  const [focusedRidoId, setFocusedRidoId] = useState<string | null>(null);
  const [ridoMapCenter, setRidoMapCenter] = useState<[number, number]>([6.9536, 124.4756]);
  const [ridoMapZoom, setRidoMapZoom] = useState<number>(8);

  // ── PIAGs State ────────────────────────────────────────────────────────────
  const [piagRecords, setPiagRecords] = useState<PIAGLocationRecord[]>(INITIAL_PIAG_RECORDS);
  const [isPiagModalOpen, setIsPiagModalOpen] = useState(false);
  const [editingPiag, setEditingPiag] = useState<PIAGLocationRecord | null>(null);
  const [piagSearch, setPiagSearch] = useState('');
  const [piagStatusFilter, setPiagStatusFilter] = useState<string>('all');
  const [piagThreatFilter, setPiagThreatFilter] = useState<string>('all');
  const [focusedPiagId, setFocusedPiagId] = useState<string | null>(null);
  const [piagMapCenter, setPiagMapCenter] = useState<[number, number]>([6.9536, 124.4756]);
  const [piagMapZoom, setPiagMapZoom] = useState<number>(8);

  // ── CMO Activities State ───────────────────────────────────────────────────
  const [cmoActivities, setCmoActivities] = useState<CMOActivityRecord[]>([]);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CMOActivityRecord | null>(null);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityStatusFilter, setActivityStatusFilter] = useState<string>('all');

  // ── Shared UI & Sync State ─────────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [rlsNotice, setRlsNotice] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // ── Fetch all CMO data from Supabase on mount ──────────────────────────────
  useEffect(() => {
    try {
      localStorage.removeItem('cmo_kmz_overlays');
      const localPiags = localStorage.getItem('cmo_piags_records');
      if (localPiags) {
        const parsed = JSON.parse(localPiags);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPiagRecords(parsed);
        } else {
          setPiagRecords(INITIAL_PIAG_RECORDS);
          localStorage.setItem('cmo_piags_records', JSON.stringify(INITIAL_PIAG_RECORDS));
        }
      } else {
        setPiagRecords(INITIAL_PIAG_RECORDS);
        localStorage.setItem('cmo_piags_records', JSON.stringify(INITIAL_PIAG_RECORDS));
      }
    } catch {
      setPiagRecords(INITIAL_PIAG_RECORDS);
    }
    loadAllCMOData();
  }, []);

  // ── Realtime Supabase Auto-Refresh ─────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const ridoChannel = supabase
      .channel('cmo-rido-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cmo_rido' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as RidoRecord;
            setRidoRecords((prev) => {
              if (prev.some((r) => r.id === newRow.id)) {
                return prev.map((r) => (r.id === newRow.id ? newRow : r));
              }
              return [newRow, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as RidoRecord;
            setRidoRecords((prev) =>
              prev.map((r) => (r.id === updatedRow.id ? updatedRow : r))
            );
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setRidoRecords((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const piagChannel = supabase
      .channel('cmo-piags-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cmo_piags' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as PIAGLocationRecord;
            setPiagRecords((prev) => {
              if (prev.some((p) => p.id === newRow.id)) {
                return prev.map((p) => (p.id === newRow.id ? newRow : p));
              }
              return [newRow, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as PIAGLocationRecord;
            setPiagRecords((prev) =>
              prev.map((p) => (p.id === updatedRow.id ? updatedRow : p))
            );
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setPiagRecords((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Refetch when returning to the tab instead of aggressive interval polling
    const handleFocus = () => {
      loadAllCMOData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      supabase?.removeChannel(ridoChannel);
      supabase?.removeChannel(piagChannel);
    };
  }, []);

  // ── Data Loader from Supabase ──────────────────────────────────────────────
  const loadAllCMOData = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      // Offline fallback: load from localStorage if present
      try {
        const localRido = localStorage.getItem('cmo_rido_records');
        if (localRido) setRidoRecords(JSON.parse(localRido));
        const localPiags = localStorage.getItem('cmo_piags_records');
        if (localPiags) setPiagRecords(JSON.parse(localPiags));
        const localActs = localStorage.getItem('cmo_activities_records');
        if (localActs) setCmoActivities(JSON.parse(localActs));
      } catch {}
      return;
    }

    setIsRefreshing(true);
    setSyncStatus('Fetching CMO data from Supabase...');

    // 1. Fetch RIDO cases
    try {
      const { data: directRido, error: ridoErr } = await supabase
        .from('cmo_rido')
        .select('*')
        .order('created_at', { ascending: false });

      if (directRido && !ridoErr) {
        setRidoRecords(directRido as RidoRecord[]);
        setRlsNotice(null);
        setSyncStatus('Connected to public.cmo_rido');
        try {
          localStorage.setItem('cmo_rido_records', JSON.stringify(directRido));
        } catch {}
      } else {
        if (ridoErr) {
          console.warn('Supabase cmo_rido table query notice:', ridoErr.message);
          if (ridoErr.message?.includes('does not exist') || ridoErr.code === '42P01') {
            setRlsNotice(
              'Table "public.cmo_rido" does not exist yet in Supabase. Click "Copy Supabase SQL Fix" below and run it in your Supabase SQL Editor.'
            );
          }
        }

        // Fallback: Check unified records table where metadata.cmo_type === 'rido'
        const { data: recData } = await supabase
          .from('records')
          .select('*')
          .order('created_at', { ascending: false });

        if (recData && recData.length > 0) {
          const ridoMirrors: RidoRecord[] = recData
            .filter((r: any) => r.metadata?.cmo_type === 'rido')
            .map((r: any) => ({
              id: r.id,
              case_code: r.code || r.metadata?.case_code || 'RIDO-RECORD',
              feuding_parties: r.title || r.metadata?.feuding_parties || 'Clan Conflict',
              party_a: r.metadata?.party_a || '',
              party_a_personalities: r.metadata?.party_a_personalities,
              party_a_affiliation: r.metadata?.party_a_affiliation,
              party_a_mgrs: r.metadata?.party_a_mgrs,
              party_b: r.metadata?.party_b || '',
              party_b_personalities: r.metadata?.party_b_personalities,
              party_b_affiliation: r.metadata?.party_b_affiliation,
              party_b_mgrs: r.metadata?.party_b_mgrs,
              personalities_involved: r.metadata?.personalities_involved || r.description || '',
              province: r.metadata?.province || 'Maguindanao del Sur',
              municipality: r.metadata?.municipality || '',
              barangay: r.metadata?.barangay || '',
              purok_sitio: r.metadata?.purok_sitio,
              address: r.location_name || r.metadata?.address || '',
              mgrs: r.metadata?.mgrs || '',
              lat: Number(r.lat) || 6.95,
              lng: Number(r.lng) || 124.47,
              root_cause: r.metadata?.root_cause || 'Land Dispute',
              root_cause_other: r.metadata?.root_cause_other,
              status: r.metadata?.status || (r.status === 'active' ? 'Active' : 'Settled / Reconciled'),
              mediating_agency: r.metadata?.mediating_agency || '601st Bde, 6ID',
              lead_mediator: r.metadata?.lead_mediator,
              fatalities_count: Number(r.metadata?.fatalities_count) || 0,
              wounded_count: Number(r.metadata?.wounded_count) || 0,
              displaced_families: Number(r.metadata?.displaced_families) || 0,
              narrative_history: r.description || r.metadata?.narrative_history,
              settlement_terms: r.metadata?.settlement_terms,
              created_at: r.created_at,
              updated_at: r.updated_at,
            }));

          if (ridoMirrors.length > 0) {
            setRidoRecords(ridoMirrors);
            setSyncStatus('Synced via Supabase records table');
          }
        }
      }
    } catch (err) {
      console.warn('Rido data fetch exception:', err);
    }

    // 2. Fetch PIAGs locations from Supabase
    try {
      let combinedPiags: PIAGLocationRecord[] = [];
      const { data: piagData, error: piagErr } = await supabase
        .from('cmo_piags')
        .select('*')
        .order('created_at', { ascending: false });

      if (piagData && !piagErr) {
        combinedPiags = piagData as PIAGLocationRecord[];
      }

      // Also check fallback mirror in records table
      const { data: recData } = await supabase
        .from('records')
        .select('*')
        .order('created_at', { ascending: false });

      if (recData && recData.length > 0) {
        const piagMirrors: PIAGLocationRecord[] = recData
          .filter(
            (r: any) =>
              r.metadata?.cmo_type === 'piag' ||
              r.metadata?.is_piag === true ||
              (r.code && String(r.code).startsWith('PIAG-'))
          )
          .map((r: any) => ({
            id: r.id,
            group_name: r.metadata?.group_name || r.title?.replace('[PIAG]', '').trim() || 'PIAG Element',
            commander_leader: r.metadata?.commander_leader || 'Unknown',
            affiliated_politician_faction: r.metadata?.affiliated_politician_faction,
            estimated_strength: r.metadata?.estimated_strength || '10-15',
            firearms_inventory: r.metadata?.total_est_firearms || r.metadata?.firearms_inventory,
            total_est_firearms: r.metadata?.total_est_firearms || r.metadata?.firearms_inventory,
            province: r.metadata?.province || 'Maguindanao del Sur',
            municipality: r.metadata?.municipality || '',
            barangay: r.metadata?.barangay || '',
            purok_sitio: r.metadata?.purok_sitio,
            address: r.location_name || r.metadata?.address || '',
            mgrs: r.metadata?.mgrs || '',
            lat: Number(r.lat) || 6.95,
            lng: Number(r.lng) || 124.47,
            status: r.metadata?.status || (r.status === 'closed' ? 'Disbanded' : 'Active'),
            threat_level: r.priority || 'high',
            notes: r.metadata?.notes || r.metadata?.remarks || r.description,
            remarks: r.metadata?.remarks || r.metadata?.notes || r.description,
            created_at: r.created_at,
            updated_at: r.updated_at,
          }));

        const existingIds = new Set(combinedPiags.map((p) => p.id));
        for (const mirror of piagMirrors) {
          if (!existingIds.has(mirror.id)) {
            combinedPiags.push(mirror);
            existingIds.add(mirror.id);
          }
        }
      }

      if (combinedPiags.length > 0) {
        setPiagRecords(combinedPiags);
        try {
          localStorage.setItem('cmo_piags_records', JSON.stringify(combinedPiags));
        } catch {}
      } else {
        // Retain current or cached records so user is never presented with an empty table
        try {
          const stored = localStorage.getItem('cmo_piags_records');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPiagRecords(parsed);
            }
          }
        } catch {}
      }
    } catch (err) {
      console.warn('PIAGs data fetch notice:', err);
    }

    // 3. Fetch CMO Activities
    try {
      const { data: actData, error: actErr } = await supabase
        .from('cmo_activities')
        .select('*')
        .order('activity_date', { ascending: false });

      if (actData && !actErr) {
        setCmoActivities(actData as CMOActivityRecord[]);
      } else {
        const { data: recData } = await supabase
          .from('records')
          .select('*')
          .eq('category', 'tasks');
        if (recData && recData.length > 0) {
          const actMirrors: CMOActivityRecord[] = recData
            .filter((r: any) => r.metadata?.cmo_type === 'activity')
            .map((r: any) => ({
              id: r.id,
              activity_title: r.title,
              activity_type: r.metadata?.activity_type || 'Civil-Military Outreach',
              target_community: r.location_name,
              province: r.metadata?.province || 'Maguindanao del Sur',
              municipality: r.metadata?.municipality || '',
              barangay: r.metadata?.barangay || '',
              address: r.location_name,
              mgrs: r.metadata?.mgrs,
              lat: Number(r.lat) || 6.95,
              lng: Number(r.lng) || 124.47,
              implementing_unit: r.metadata?.implementing_unit || '6CMOBn',
              stakeholders_partners: r.metadata?.stakeholders_partners,
              beneficiaries_count: Number(r.metadata?.beneficiaries_count) || 0,
              activity_date: r.metadata?.activity_date || r.created_at.slice(0, 10),
              status: r.metadata?.status || 'Completed',
              remarks: r.description,
              created_at: r.created_at,
              updated_at: r.updated_at,
            }));
          if (actMirrors.length > 0) setCmoActivities(actMirrors);
        }
      }
    } catch (err) {
      console.warn('CMO activities fetch notice:', err);
    }

    // 4. Purge any legacy KMZ overlays & imports from localStorage
    try {
      localStorage.removeItem('cmo_kmz_overlays');
      const storedPiags = localStorage.getItem('cmo_piags_records');
      if (storedPiags) {
        const parsed = JSON.parse(storedPiags);
        const cleaned = parsed.filter(
          (p: any) =>
            !p.notes?.includes('[KMZ IMPORT') &&
            !p.id?.startsWith('kmz-') &&
            p.source !== 'kmz'
        );
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('cmo_piags_records', JSON.stringify(cleaned));
          setPiagRecords(cleaned);
        }
      }
    } catch {}
    finally {
      setIsRefreshing(false);
    }
  };

  // ── Save & Delete Handlers for RIDO ────────────────────────────────────────
  const handleSaveRido = async (record: RidoRecord) => {
    // 1. Optimistic local state update
    const isEdit = ridoRecords.some((r) => r.id === record.id);
    const updated = isEdit
      ? ridoRecords.map((r) => (r.id === record.id ? record : r))
      : [record, ...ridoRecords];
    setRidoRecords(updated);

    try {
      localStorage.setItem('cmo_rido_records', JSON.stringify(updated));
    } catch {}

    // 2. Direct Supabase save to public.cmo_rido table
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error: sbErr } = await supabase.from('cmo_rido').upsert([record]);
        if (sbErr) {
          console.warn('Direct cmo_rido upsert notice:', sbErr.message);
          if (sbErr.message?.includes('row-level security') || sbErr.code === '42501') {
            setRlsNotice(
              'Row-Level Security (RLS) policy requires permission for public.cmo_rido. Click "Copy Supabase SQL Fix" below.'
            );
          } else if (sbErr.message?.includes('does not exist') || sbErr.code === '42P01') {
            setRlsNotice(
              'Table "public.cmo_rido" does not exist in Supabase yet. Click "Copy Supabase SQL Fix" below to create it.'
            );
          }
        } else {
          setRlsNotice(null);
        }
      } catch (err: any) {
        console.warn('Supabase cmo_rido write exception:', err);
      }

      // 3. Mirror to standard records table (category: 'reports')
      // Guarantees persistence even before dedicated table is created in Supabase!
      try {
        const recordMirror: Partial<RecordItem> = {
          id: record.id,
          code: record.case_code,
          title: record.feuding_parties,
          category: 'reports',
          description: `[RIDO CONFLICT] ${record.root_cause} | Status: ${record.status} | Personalities: ${record.personalities_involved} | Fatalities: ${record.fatalities_count}, Wounded: ${record.wounded_count} | Lead: ${record.mediating_agency}`,
          status: record.status === 'Settled / Reconciled' ? 'closed' : 'active',
          priority: record.status === 'Active' ? 'critical' : record.status === 'High Tension' ? 'high' : 'medium',
          lat: record.lat,
          lng: record.lng,
          location_name: record.address || `${record.barangay}, ${record.municipality}`,
          metadata: {
            cmo_type: 'rido',
            is_rido: true,
            case_code: record.case_code,
            feuding_parties: record.feuding_parties,
            party_a: record.party_a,
            party_a_personalities: record.party_a_personalities,
            party_a_affiliation: record.party_a_affiliation,
            party_a_mgrs: record.party_a_mgrs,
            party_b: record.party_b,
            party_b_personalities: record.party_b_personalities,
            party_b_affiliation: record.party_b_affiliation,
            party_b_mgrs: record.party_b_mgrs,
            personalities_involved: record.personalities_involved,
            province: record.province,
            municipality: record.municipality,
            barangay: record.barangay,
            purok_sitio: record.purok_sitio,
            address: record.address,
            mgrs: record.mgrs,
            root_cause: record.root_cause,
            root_cause_other: record.root_cause_other,
            status: record.status,
            mediating_agency: record.mediating_agency,
            lead_mediator: record.lead_mediator,
            fatalities_count: record.fatalities_count,
            wounded_count: record.wounded_count,
            displaced_families: record.displaced_families,
            narrative_history: record.narrative_history,
            settlement_terms: record.settlement_terms,
          },
          updated_at: new Date().toISOString(),
        };

        await supabase.from('records').upsert([recordMirror]);
        if (onRefreshData) onRefreshData();
      } catch (mirrorErr) {
        console.warn('Supabase records mirror error:', mirrorErr);
      }
    }
  };

  const handleDeleteRido = async (id: string, code?: string) => {
    if (!confirm(`Are you sure you want to delete Rido case record "${code || id}"?`)) return;
    const updated = ridoRecords.filter((r) => r.id !== id);
    setRidoRecords(updated);

    try {
      localStorage.setItem('cmo_rido_records', JSON.stringify(updated));
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('cmo_rido').delete().eq('id', id);
      } catch {}
      try {
        await supabase.from('records').delete().eq('id', id);
        if (onRefreshData) onRefreshData();
      } catch {}
    }
  };

  // ── Save & Delete Handlers for PIAGs ───────────────────────────────────────
  const handleSavePiag = async (record: PIAGLocationRecord) => {
    const isEdit = piagRecords.some((p) => p.id === record.id);
    const updated = isEdit
      ? piagRecords.map((p) => (p.id === record.id ? record : p))
      : [record, ...piagRecords];
    setPiagRecords(updated);

    try {
      localStorage.setItem('cmo_piags_records', JSON.stringify(updated));
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('cmo_piags').upsert([record]);
      } catch (piagErr) {
        console.warn('cmo_piags table save notice:', piagErr);
      }

      try {
        const mirror: Partial<RecordItem> = {
          id: record.id,
          code: `PIAG-${(record.group_name || 'ELEM').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`,
          title: `[PIAG] ${record.group_name}`,
          category: 'units',
          description: record.notes || record.remarks || `Leader: ${record.commander_leader} | Strength: ${record.estimated_strength} | Firearms: ${record.total_est_firearms || record.firearms_inventory || 'N/A'} | Status: ${record.status}`,
          status: record.status === 'Disbanded' ? 'closed' : 'active',
          priority: record.threat_level || 'high',
          lat: record.lat,
          lng: record.lng,
          location_name: record.address || `${record.barangay}, ${record.municipality}`,
          metadata: {
            cmo_type: 'piag',
            is_piag: true,
            group_name: record.group_name,
            commander_leader: record.commander_leader,
            affiliated_politician_faction: record.affiliated_politician_faction,
            estimated_strength: record.estimated_strength,
            firearms_inventory: record.total_est_firearms || record.firearms_inventory,
            total_est_firearms: record.total_est_firearms || record.firearms_inventory,
            mgrs: record.mgrs,
            province: record.province,
            municipality: record.municipality,
            barangay: record.barangay,
            purok_sitio: record.purok_sitio,
            address: record.address,
            status: record.status,
            threat_level: record.threat_level,
            notes: record.notes || record.remarks,
            remarks: record.remarks || record.notes,
          },
          updated_at: new Date().toISOString(),
        };
        await supabase.from('records').upsert([mirror]);
        if (onRefreshData) onRefreshData();
      } catch (recErr) {
        console.warn('Supabase records mirror notice:', recErr);
      }
    }
  };

  const handleDeletePiag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this PIAG location record?')) return;
    const updated = piagRecords.filter((p) => p.id !== id);
    setPiagRecords(updated);

    try {
      localStorage.setItem('cmo_piags_records', JSON.stringify(updated));
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('cmo_piags').delete().eq('id', id);
      } catch {}
      try {
        await supabase.from('records').delete().eq('id', id);
        if (onRefreshData) onRefreshData();
      } catch {}
    }
  };

  const handleClearAllPiags = async () => {
    if (!confirm('Are you sure you want to remove all PIAG locations? This will clear all plotted PIAG coordinates.')) return;
    setPiagRecords([]);
    setFocusedPiagId(null);

    try {
      localStorage.removeItem('cmo_piags_records');
      localStorage.removeItem('cmo_kmz_overlays');
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('cmo_piags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch {}
      try {
        await supabase.from('records').delete().or('code.ilike.%PIAG%,title.ilike.%PIAG%');
        if (onRefreshData) onRefreshData();
      } catch {}
    }
  };

  // ── Save & Delete Handlers for CMO Activities ──────────────────────────────
  const handleSaveActivity = async (record: CMOActivityRecord) => {
    const isEdit = cmoActivities.some((a) => a.id === record.id);
    const updated = isEdit
      ? cmoActivities.map((a) => (a.id === record.id ? record : a))
      : [record, ...cmoActivities];
    setCmoActivities(updated);

    try {
      localStorage.setItem('cmo_activities_records', JSON.stringify(updated));
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('cmo_activities').upsert([record]);
      } catch {}
      try {
        const mirror: Partial<RecordItem> = {
          id: record.id,
          code: `CMO-ACT-${record.activity_date.slice(5).replace('-', '')}`,
          title: record.activity_title,
          category: 'tasks',
          description: `[${record.activity_type}] Target: ${record.target_community} | Lead: ${record.implementing_unit} | Beneficiaries: ${record.beneficiaries_count} | Status: ${record.status}`,
          status: record.status === 'Completed' ? 'closed' : 'active',
          priority: 'medium',
          lat: record.lat || 6.95,
          lng: record.lng || 124.47,
          location_name: record.address || record.target_community,
          metadata: {
            cmo_type: 'activity',
            is_cmo_activity: true,
            activity_title: record.activity_title,
            activity_type: record.activity_type,
            target_community: record.target_community,
            implementing_unit: record.implementing_unit,
            stakeholders_partners: record.stakeholders_partners,
            beneficiaries_count: record.beneficiaries_count,
            activity_date: record.activity_date,
            status: record.status,
          },
          updated_at: new Date().toISOString(),
        };
        await supabase.from('records').upsert([mirror]);
        if (onRefreshData) onRefreshData();
      } catch {}
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this CMO activity record?')) return;
    const updated = cmoActivities.filter((a) => a.id !== id);
    setCmoActivities(updated);

    try {
      localStorage.setItem('cmo_activities_records', JSON.stringify(updated));
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('cmo_activities').delete().eq('id', id);
      } catch {}
      try {
        await supabase.from('records').delete().eq('id', id);
        if (onRefreshData) onRefreshData();
      } catch {}
    }
  };

  // ── Copy Helper ────────────────────────────────────────────────────────────
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // ── Filtered Rido Records ──────────────────────────────────────────────────
  const filteredRidos = useMemo(() => {
    return ridoRecords.filter((r) => {
      const matchSearch =
        !ridoSearch ||
        r.case_code.toLowerCase().includes(ridoSearch.toLowerCase()) ||
        r.feuding_parties.toLowerCase().includes(ridoSearch.toLowerCase()) ||
        r.party_a.toLowerCase().includes(ridoSearch.toLowerCase()) ||
        r.party_b.toLowerCase().includes(ridoSearch.toLowerCase()) ||
        r.personalities_involved.toLowerCase().includes(ridoSearch.toLowerCase()) ||
        r.address.toLowerCase().includes(ridoSearch.toLowerCase()) ||
        r.mgrs.toLowerCase().includes(ridoSearch.toLowerCase()) ||
        r.root_cause.toLowerCase().includes(ridoSearch.toLowerCase()) ||
        r.mediating_agency.toLowerCase().includes(ridoSearch.toLowerCase());

      const matchStatus = ridoStatusFilter === 'all' || r.status === ridoStatusFilter;
      const matchProvince = ridoProvinceFilter === 'all' || r.province === ridoProvinceFilter;

      return matchSearch && matchStatus && matchProvince;
    });
  }, [ridoRecords, ridoSearch, ridoStatusFilter, ridoProvinceFilter]);

  // ── Filtered PIAG Records ──────────────────────────────────────────────────
  const filteredPiags = useMemo(() => {
    return piagRecords.filter((p) => {
      const matchSearch =
        !piagSearch ||
        p.group_name.toLowerCase().includes(piagSearch.toLowerCase()) ||
        p.commander_leader.toLowerCase().includes(piagSearch.toLowerCase()) ||
        (p.affiliated_politician_faction &&
          p.affiliated_politician_faction.toLowerCase().includes(piagSearch.toLowerCase())) ||
        (p.address && p.address.toLowerCase().includes(piagSearch.toLowerCase())) ||
        p.mgrs.toLowerCase().includes(piagSearch.toLowerCase());

      const matchStatus = piagStatusFilter === 'all' || p.status === piagStatusFilter;
      const matchThreat = piagThreatFilter === 'all' || p.threat_level === piagThreatFilter;
      return matchSearch && matchStatus && matchThreat;
    });
  }, [piagRecords, piagSearch, piagStatusFilter, piagThreatFilter]);

  // ── Convert Filtered PIAGs to TacticalMap RecordItem format ────────────────
  const piagMapRecords: RecordItem[] = useMemo(() => {
    return filteredPiags.map((p) => {
      const arms = p.total_est_firearms || p.firearms_inventory || 'Unspecified';
      const obs = p.notes || p.remarks || '';
      return {
        id: p.id,
        code: `PIAG-${(p.group_name || 'ELEM').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`,
        title: `[PIAG] ${p.group_name}`,
        category: 'units' as RecordCategory,
        description: `Leader: ${p.commander_leader} | Strength: ${p.estimated_strength} | Firearms: ${arms} | Affiliation: ${p.affiliated_politician_faction || 'Independent'}`,
        status: p.status === 'Disbanded' ? 'closed' : 'active',
        priority: p.threat_level || (p.status === 'Active' ? 'critical' : 'high'),
        lat: Number(p.lat),
        lng: Number(p.lng),
        location_name: p.address || `${p.barangay}, ${p.municipality}, ${p.province}`,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || p.created_at || new Date().toISOString(),
        metadata: {
          is_piag: true,
          cmo_type: 'piag',
          group_name: p.group_name,
          commander_leader: p.commander_leader,
          affiliated_politician_faction: p.affiliated_politician_faction,
          estimated_strength: p.estimated_strength,
          firearms_inventory: arms,
          total_est_firearms: arms,
          province: p.province,
          municipality: p.municipality,
          barangay: p.barangay,
          purok_sitio: p.purok_sitio,
          address: p.address,
          mgrs: p.mgrs,
          status: p.status,
          threat_level: p.threat_level,
          notes: obs,
          remarks: obs,
        },
      };
    });
  }, [filteredPiags]);

  // ── Convert Rido Cases to TacticalMap Records (Party A & Party B Pins) ────
  const ridoMapRecords: RecordItem[] = useMemo(() => {
    const mapItems: RecordItem[] = [];

    filteredRidos.forEach((r) => {
      // 1. Party A Pin
      const latA = r.party_a_lat || r.lat || 6.9536;
      const lngA = r.party_a_lng || (r.lng ? r.lng - 0.015 : 124.4606); // slight tactical offset if same coords
      const mgrsA = r.party_a_mgrs || r.mgrs;
      const nameA = r.party_a || r.feuding_parties?.split(/vs\.?|—/i)[0]?.trim() || 'Clan A';
      const nameB = r.party_b || r.feuding_parties?.split(/vs\.?|—/i)[1]?.trim() || 'Clan B';

      mapItems.push({
        id: `rido-${r.id}-party-a`,
        code: `CLAN-A`,
        title: nameA,
        category: 'units' as RecordCategory,
        description: `Feud against: ${nameB} | Affiliation: ${r.party_a_affiliation || 'Independent'} | Key Personnel: ${r.party_a_personalities || r.personalities_involved || 'Unspecified'} | Root Cause: ${r.root_cause}`,
        status: r.status === 'Settled / Reconciled' ? 'closed' : 'active',
        priority: r.status === 'Active' ? 'critical' : r.status === 'High Tension' ? 'high' : 'medium',
        lat: Number(latA),
        lng: Number(lngA),
        location_name: `${r.barangay}, ${r.municipality} (Party A Base)`,
        created_at: r.created_at || new Date().toISOString(),
        updated_at: r.updated_at || r.created_at || new Date().toISOString(),
        metadata: {
          is_rido_party: true,
          cmo_type: 'rido_party',
          party_type: 'A',
          clan_name: nameA,
          opposing_party: nameB,
          rido_id: r.id,
          case_code: r.case_code,
          affiliation: r.party_a_affiliation || 'Independent',
          personalities: r.party_a_personalities,
          mgrs: mgrsA,
          root_cause: r.root_cause,
          status: r.status,
        },
      });

      // 2. Party B Pin
      const latB = r.party_b_lat || (r.lat ? r.lat + 0.012 : 6.9656);
      const lngB = r.party_b_lng || (r.lng ? r.lng + 0.015 : 124.4906);
      const mgrsB = r.party_b_mgrs || r.mgrs;

      mapItems.push({
        id: `rido-${r.id}-party-b`,
        code: `CLAN-B`,
        title: nameB,
        category: 'units' as RecordCategory,
        description: `Feud against: ${nameA} | Affiliation: ${r.party_b_affiliation || 'Independent'} | Key Personnel: ${r.party_b_personalities || r.personalities_involved || 'Unspecified'} | Root Cause: ${r.root_cause}`,
        status: r.status === 'Settled / Reconciled' ? 'closed' : 'active',
        priority: r.status === 'Active' ? 'critical' : r.status === 'High Tension' ? 'high' : 'medium',
        lat: Number(latB),
        lng: Number(lngB),
        location_name: `${r.barangay}, ${r.municipality} (Party B Base)`,
        created_at: r.created_at || new Date().toISOString(),
        updated_at: r.updated_at || r.created_at || new Date().toISOString(),
        metadata: {
          is_rido_party: true,
          cmo_type: 'rido_party',
          party_type: 'B',
          clan_name: nameB,
          opposing_party: nameA,
          rido_id: r.id,
          case_code: r.case_code,
          affiliation: r.party_b_affiliation || 'Independent',
          personalities: r.party_b_personalities,
          mgrs: mgrsB,
          root_cause: r.root_cause,
          status: r.status,
        },
      });
    });

    // 3. Also include all PIAG records on this map so affiliated MILF/MNLF bases are visible
    piagMapRecords.forEach((pm) => {
      mapItems.push(pm);
    });

    return mapItems;
  }, [filteredRidos, piagMapRecords]);

  // ── Tactical Links: Feud lines between Party A & B, and Alliance lines to MILF bases ─
  const ridoTacticalLinks: TacticalLink[] = useMemo(() => {
    const links: TacticalLink[] = [];

    filteredRidos.forEach((r) => {
      const latA = Number(r.party_a_lat || r.lat || 6.9536);
      const lngA = Number(r.party_a_lng || (r.lng ? r.lng - 0.015 : 124.4606));

      const latB = Number(r.party_b_lat || (r.lat ? r.lat + 0.012 : 6.9656));
      const lngB = Number(r.party_b_lng || (r.lng ? r.lng + 0.015 : 124.4906));

      const nameA = r.party_a || r.feuding_parties?.split(/vs\.?|—/i)[0]?.trim() || 'Clan A';
      const nameB = r.party_b || r.feuding_parties?.split(/vs\.?|—/i)[1]?.trim() || 'Clan B';

      // 1. Feud conflict line connecting Party A and Party B
      links.push({
        id: `feud-link-${r.id}`,
        from: [latA, lngA],
        to: [latB, lngB],
        label: `Active Feud: ${nameA} (vs) ${nameB} [${r.status}]`,
        color: '#ef4444', // Red dashed clash line
        dashArray: '5, 6',
        weight: 3,
        opacity: 0.85,
        badgeText: '(vs)',
      });

      // 2. Link affiliated MILF elements for Party A
      if (r.party_a_affiliation && r.party_a_affiliation.toUpperCase().includes('MILF')) {
        const matchingPiag = piagRecords.find((p) =>
          p.group_name.toLowerCase().includes('milf') ||
          (r.party_a_affiliation && p.group_name.toLowerCase().includes(r.party_a_affiliation.toLowerCase()))
        );
        if (matchingPiag && matchingPiag.lat && matchingPiag.lng) {
          links.push({
            id: `milf-link-a-${r.id}`,
            from: [latA, lngA],
            to: [Number(matchingPiag.lat), Number(matchingPiag.lng)],
            label: `MILF Affiliation: ${nameA} (affiliated) ${matchingPiag.group_name}`,
            color: '#10b981', // Emerald green alliance line
            dashArray: '6, 8',
            weight: 2.5,
            opacity: 0.9,
            badgeText: '(affiliated)',
          });
        }
      }

      // 3. Link affiliated MILF elements for Party B
      if (r.party_b_affiliation && r.party_b_affiliation.toUpperCase().includes('MILF')) {
        const matchingPiag = piagRecords.find((p) =>
          p.group_name.toLowerCase().includes('milf') ||
          (r.party_b_affiliation && p.group_name.toLowerCase().includes(r.party_b_affiliation.toLowerCase()))
        );
        if (matchingPiag && matchingPiag.lat && matchingPiag.lng) {
          links.push({
            id: `milf-link-b-${r.id}`,
            from: [latB, lngB],
            to: [Number(matchingPiag.lat), Number(matchingPiag.lng)],
            label: `MILF Affiliation: ${nameB} (affiliated) ${matchingPiag.group_name}`,
            color: '#10b981', // Emerald green alliance line
            dashArray: '6, 8',
            weight: 2.5,
            opacity: 0.9,
            badgeText: '(affiliated)',
          });
        }
      }
    });

    return links;
  }, [filteredRidos, piagRecords]);

  const handleLocateRidoOnMap = (r: RidoRecord) => {
    setFocusedRidoId(`rido-${r.id}-party-a`);
    const lat = Number(r.party_a_lat || r.lat || 6.9536);
    const lng = Number(r.party_a_lng || r.lng || 124.4756);
    setRidoMapCenter([lat, lng]);
    setRidoMapZoom(13);
    const mapElement = document.getElementById('rido-tactical-map-container');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleLocatePiagOnMap = (piag: PIAGLocationRecord) => {
    setFocusedPiagId(piag.id);
    if (piag.lat && piag.lng) {
      setPiagMapCenter([Number(piag.lat), Number(piag.lng)]);
      setPiagMapZoom(13);
    }
    const mapElement = document.getElementById('piag-tactical-map-container');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // ── Filtered CMO Activities ────────────────────────────────────────────────
  const filteredActivities = useMemo(() => {
    return cmoActivities.filter((a) => {
      const matchSearch =
        !activitySearch ||
        a.activity_title.toLowerCase().includes(activitySearch.toLowerCase()) ||
        a.activity_type.toLowerCase().includes(activitySearch.toLowerCase()) ||
        a.target_community.toLowerCase().includes(activitySearch.toLowerCase()) ||
        a.implementing_unit.toLowerCase().includes(activitySearch.toLowerCase());

      const matchStatus = activityStatusFilter === 'all' || a.status === activityStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [cmoActivities, activitySearch, activityStatusFilter]);

  // ── Stats Calculations ─────────────────────────────────────────────────────
  const ridoStats = useMemo(() => {
    const total = ridoRecords.length;
    const active = ridoRecords.filter((r) => r.status === 'Active' || r.status === 'High Tension').length;
    const underMediation = ridoRecords.filter((r) => r.status === 'Under Mediation').length;
    const settled = ridoRecords.filter((r) => r.status === 'Settled / Reconciled').length;
    const fatalities = ridoRecords.reduce((sum, r) => sum + (r.fatalities_count || 0), 0);
    return { total, active, underMediation, settled, fatalities };
  }, [ridoRecords]);

  const piagStats = useMemo(() => {
    const total = piagRecords.length;
    const active = piagRecords.filter((p) => p.status === 'Active').length;
    const monitored = piagRecords.filter((p) => p.status === 'Monitored').length;
    return { total, active, monitored };
  }, [piagRecords]);

  const activityStats = useMemo(() => {
    const total = cmoActivities.length;
    const completed = cmoActivities.filter((a) => a.status === 'Completed').length;
    const beneficiaries = cmoActivities.reduce((sum, a) => sum + (a.beneficiaries_count || 0), 0);
    return { total, completed, beneficiaries };
  }, [cmoActivities]);

  const getStatusBadge = (st: RidoStatus) => {
    switch (st) {
      case 'Active':
        return 'bg-blue-50 text-blue-700 border-blue-300 font-bold';
      case 'High Tension':
        return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
      case 'Under Mediation':
        return 'bg-blue-100 text-blue-800 border-blue-300 font-semibold';
      case 'Settled / Reconciled':
        return 'bg-slate-50 text-slate-700 border-slate-200 font-semibold';
      case 'Dormant':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const SQL_TABLE_SCHEMA = `-- CMO Cell Tables (Run in Supabase SQL Editor)
CREATE TABLE IF NOT EXISTS public.cmo_rido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_code TEXT NOT NULL,
  feuding_parties TEXT NOT NULL,
  party_a TEXT NOT NULL,
  party_a_personalities TEXT,
  party_a_affiliation TEXT,
  party_a_mgrs TEXT,
  party_a_lat DOUBLE PRECISION,
  party_a_lng DOUBLE PRECISION,
  party_b TEXT NOT NULL,
  party_b_personalities TEXT,
  party_b_affiliation TEXT,
  party_b_mgrs TEXT,
  party_b_lat DOUBLE PRECISION,
  party_b_lng DOUBLE PRECISION,
  personalities_involved TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT 'Maguindanao del Sur',
  municipality TEXT NOT NULL DEFAULT 'Datu Piang (Dulawan)',
  barangay TEXT NOT NULL DEFAULT 'Poblacion',
  purok_sitio TEXT,
  address TEXT NOT NULL,
  mgrs TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL DEFAULT 6.9536,
  lng DOUBLE PRECISION NOT NULL DEFAULT 124.4756,
  root_cause TEXT NOT NULL DEFAULT 'Land Dispute & Boundary Conflict',
  root_cause_other TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  mediating_agency TEXT NOT NULL DEFAULT '601st Infantry Brigade (6ID, PA)',
  lead_mediator TEXT,
  fatalities_count INTEGER DEFAULT 0,
  wounded_count INTEGER DEFAULT 0,
  displaced_families INTEGER DEFAULT 0,
  narrative_history TEXT,
  settlement_terms TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist idempotently
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_a_personalities') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_a_personalities TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_a_affiliation') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_a_affiliation TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_a_mgrs') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_a_mgrs TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_b_personalities') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_b_personalities TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_b_affiliation') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_b_affiliation TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_b_mgrs') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_b_mgrs TEXT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.cmo_piags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  commander_leader TEXT NOT NULL,
  affiliated_politician_faction TEXT,
  estimated_strength TEXT DEFAULT 'Unspecified',
  total_est_firearms TEXT DEFAULT 'Unspecified',
  firearms_inventory TEXT DEFAULT 'Unspecified',
  province TEXT NOT NULL DEFAULT 'Maguindanao del Sur',
  municipality TEXT NOT NULL DEFAULT 'Datu Piang (Dulawan)',
  barangay TEXT NOT NULL DEFAULT 'Poblacion',
  purok_sitio TEXT,
  address TEXT,
  mgrs TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL DEFAULT 6.9536,
  lng DOUBLE PRECISION NOT NULL DEFAULT 124.4756,
  status TEXT NOT NULL DEFAULT 'Active',
  threat_level TEXT NOT NULL DEFAULT 'high',
  notes TEXT,
  remarks TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.cmo_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_title TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  target_community TEXT NOT NULL,
  province TEXT NOT NULL,
  municipality TEXT NOT NULL,
  barangay TEXT NOT NULL,
  address TEXT,
  mgrs TEXT,
  lat NUMERIC,
  lng NUMERIC,
  implementing_unit TEXT NOT NULL,
  stakeholders_partners TEXT,
  beneficiaries_count INTEGER DEFAULT 0,
  activity_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Planned',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable RLS and permissive policy for client interaction:
ALTER TABLE public.cmo_rido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmo_piags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmo_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on cmo_rido" ON public.cmo_rido;
DROP POLICY IF EXISTS "Allow all on cmo_piags" ON public.cmo_piags;
DROP POLICY IF EXISTS "Allow all on cmo_activities" ON public.cmo_activities;

CREATE POLICY "Allow all on cmo_rido" ON public.cmo_rido FOR ALL TO anon, authenticated, public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cmo_piags" ON public.cmo_piags FOR ALL TO anon, authenticated, public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cmo_activities" ON public.cmo_activities FOR ALL TO anon, authenticated, public USING (true) WITH CHECK (true);

-- Insert Initial PIAG Location Records Created in PIAG Location Modal:
INSERT INTO public.cmo_piags (
  id, group_name, commander_leader, affiliated_politician_faction,
  estimated_strength, total_est_firearms, firearms_inventory,
  province, municipality, barangay, purok_sitio, address,
  mgrs, lat, lng, status, threat_level, notes, remarks
) VALUES
('a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c81', 'MILF — 105th Base Command', 'Commander Jack / Ting Sinsuat', 'Former Mayoralty candidate / Municipal Boss', '15-20 armed personnel', '12 (8x M16, 2x M14, 1x M203, 1x Cal .45)', '12 (8x M16, 2x M14, 1x M203, 1x Cal .45)', 'Maguindanao del Sur', 'Datu Piang (Dulawan)', 'Poblacion', 'Sitio Riverside', 'Sitio Riverside, Poblacion, Datu Piang (Dulawan), Maguindanao del Sur', '51NXH6659745322', 6.9536, 124.4756, 'Active', 'critical', 'Staging element active along river crossing. Surveillance reports indicate mobilization for localized election security intimidation.', 'Staging element active along river crossing. Surveillance reports indicate mobilization for localized election security intimidation.'),
('b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d92', 'MNLF — Lupah Sug Force', 'Commander Abdulradzak / Kuyo Aliman', 'Provincial Board & Tayuan Faction Alliance', '25-30 armed personnel', '22 (14x M16, 5x M14, 2x M203, 1x Ultimax 100 LMG)', '22 (14x M16, 5x M14, 2x M203, 1x Ultimax 100 LMG)', 'Maguindanao del Sur', 'Nabalawag', 'Brgy Olandang', 'Sitio Bentad', 'Sitio Bentad, Brgy Olandang, Nabalawag, Maguindanao del Sur', '51NXH6771379711', 7.0515, 124.5184, 'Active', 'high', 'Previously engaged in territorial dispute encounter in Sitio Bentad. Continuous monitoring by CMO Civil Relations service.', 'Previously engaged in territorial dispute encounter in Sitio Bentad. Continuous monitoring by CMO Civil Relations service.'),
('c3d4e5f6-a1b2-4c3d-ae4f-5a6b7c8d9e03', 'MILF — 118th Base Command', 'Field Cmdr Ebrahim Usman @Bords / Badrudin Angkad', 'Hon. Esmael Tayuan / SGA Coalition', '15-20 armed combatants', '18 (11x M16, 3x M14, 2x M203, 2x Cal .50 Barrett)', '18 (11x M16, 3x M14, 2x Cal .50 Barrett, 2x M203)', 'Maguindanao del Sur', 'Shariff Saydona Mustapha', 'Datu Bakal', 'Sitio Bakal Proper', 'Sitio Bakal Proper, Datu Bakal, Shariff Saydona Mustapha, Maguindanao del Sur', '51NXH7120068400', 6.9500, 124.5200, 'Monitored', 'high', 'Maintains armed presence near marsh perimeter. Dialogue facilitated through Coordinating Committee on the Cessation of Hostilities (CCCH).', 'Maintains armed presence near marsh perimeter. Dialogue facilitated through Coordinating Committee on the Cessation of Hostilities (CCCH).'),
('d4e5f6a1-b2c3-4d4e-bf5a-6b7c8d9e0f14', 'MNLF — Paglas Defense Contingent', 'Ustadz Wahab / Datu Ronnie', 'Municipal Executive Clan Alliance', '10-15 combatants', '10 (6x M16, 2x Garand, 2x .45 pistols)', '10 (6x M16, 2x Garand, 2x .45 pistols)', 'Maguindanao del Sur', 'Datu Paglas', 'Poblacion', 'Compound Alpha', 'Compound Alpha, Poblacion, Datu Paglas, Maguindanao del Sur', '51NYG0598964012', 6.7450, 124.8600, 'Monitored', 'medium', 'Defensive perimeter security around municipal estate. Low offensive posture recorded during recent intelligence sweep.', 'Defensive perimeter security around municipal estate. Low offensive posture recorded during recent intelligence sweep.')
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';`;

  return (
    <div className="space-y-6 font-sans">
   
      {/* RLS / Table Setup Notice if Table missing */}
      {rlsNotice && (
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-start space-x-2.5 text-slate-800">
            <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Supabase Schema Notice: </span>
              <span className="text-slate-600">{rlsNotice}</span>
            </div>
          </div>
          <button
            onClick={() => handleCopy(SQL_TABLE_SCHEMA, 'sql-schema')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shrink-0 active:scale-95 shadow-sm"
          >
            {copiedKey === 'sql-schema' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'sql-schema' ? 'SQL Copied!' : 'Copy Supabase SQL Fix'}</span>
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── 2. HORIZONTAL TAB NAVIGATION (RIDO, PIAGs location, CMO activities) ─ */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-1.5">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {/* Tab 1: RIDO */}
          <button
            onClick={() => setActiveTab('rido')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-sans transition-all shrink-0 ${
              activeTab === 'rido'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Scale className={`w-4 h-4 ${activeTab === 'rido' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className="uppercase font-bold tracking-wide">RIDO (Clan Feuds &amp; Settlements)</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-sans border ${
                activeTab === 'rido'
                  ? 'bg-blue-100 text-blue-800 border-blue-200 font-bold'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {ridoRecords.length}
            </span>
          </button>

          {/* Tab 2: PIAGs location */}
          <button
            onClick={() => setActiveTab('piags')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-sans transition-all shrink-0 ${
              activeTab === 'piags'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Crosshair className={`w-4 h-4 ${activeTab === 'piags' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className="uppercase font-bold tracking-wide">PIAGs Location &amp; Tracking</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-sans border ${
                activeTab === 'piags'
                  ? 'bg-blue-100 text-blue-800 border-blue-200 font-bold'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {piagRecords.length}
            </span>
          </button>

          {/* Tab 3: CMO activities */}
          <button
            onClick={() => setActiveTab('cmo_activities')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-sans transition-all shrink-0 ${
              activeTab === 'cmo_activities'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <HeartHandshake className={`w-4 h-4 ${activeTab === 'cmo_activities' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className="uppercase font-bold tracking-wide">CMO Activities &amp; Outreach</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-sans border ${
                activeTab === 'cmo_activities'
                  ? 'bg-blue-100 text-blue-800 border-blue-200 font-bold'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {cmoActivities.length}
            </span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 1: RIDO TAB (Personalities, Locations & Supabase Table) ───────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'rido' && (
        <div className="space-y-1">
          {/* 4 Stat Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                Total Rido Conflict Cases
              </div>
              <div className="text-2xl font-sans font-bold text-blue-600 mt-1">{ridoStats.total}</div>
              <div className="text-xs font-sans text-slate-400 mt-0.5">Recorded in Supabase</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                Active / Escalated Feuds
              </div>
              <div className="text-2xl font-sans font-bold text-blue-700 mt-1">{ridoStats.active}</div>
              <div className="text-xs font-sans text-slate-400 mt-0.5">Requires immediate intercession</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                Under Mediation Dialogues
              </div>
              <div className="text-2xl font-sans font-bold text-slate-800 mt-1">{ridoStats.underMediation}</div>
              <div className="text-xs font-sans text-slate-400 mt-0.5">Ceasefire &amp; settlement talks</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
                Settled / Peace Pacts
              </div>
              <div className="text-2xl font-sans font-bold text-slate-800 mt-1">{ridoStats.settled}</div>
              <div className="text-xs font-sans text-slate-400 mt-0.5">Kasunduan executed</div>
            </div>
          </div>
          {/* Search, Filter Bar & Actions */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search clans, personalities, location, MGRS, root cause..."
                  value={ridoSearch}
                  onChange={(e) => setRidoSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={ridoStatusFilter}
                onChange={(e) => setRidoStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="all">All Conflict Statuses</option>
                <option value="Active">Active / Escalated</option>
                <option value="High Tension">High Tension</option>
                <option value="Under Mediation">Under Mediation</option>
                <option value="Settled / Reconciled">Settled / Reconciled</option>
                <option value="Dormant">Dormant</option>
              </select>

              {/* View Mode Switcher: Table vs Cards */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                <button
                  onClick={() => setRidoViewMode('table')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] uppercase transition-all ${
                    ridoViewMode === 'table'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Table View"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  onClick={() => setRidoViewMode('cards')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] uppercase transition-all ${
                    ridoViewMode === 'cards'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Briefing Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>
            </div>

            {/* Add Rido Button */}
            <button
              onClick={() => {
                setEditingRido(null);
                setIsRidoModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Rido Personality &amp; Location</span>
            </button>
          </div>
          {/* ── RIDO TACTICAL GEOSPATIAL MAP (PARTY A, PARTY B & MILF ALLIANCE LINKS) ── */}
          <div
            id="rido-tactical-map-container"
            className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden"
          >

            {/* Tactical Map Display */}
            <div className="relative isolate z-0">
              <TacticalMap
                records={ridoMapRecords}
                customLinks={ridoTacticalLinks}
                onSelectRecord={(rec) => {
                  setFocusedRidoId(rec.id);
                  if (rec.lat && rec.lng) {
                    setRidoMapCenter([Number(rec.lat), Number(rec.lng)]);
                    setRidoMapZoom(13);
                  }
                }}
                center={ridoMapCenter}
                zoom={ridoMapZoom}
                focusedRecordId={focusedRidoId}
                className="h-[600px] w-full"
                isLive={true}
                onRefresh={loadAllCMOData}
              />

              {/* Tactical Legend Overlay for Rido Feuds & MILF Links */}
              <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-md flex items-center space-x-3 text-[11px] text-slate-700 font-medium max-w-[95%] overflow-x-auto">
                <div className="flex items-center space-x-1.5 shrink-0">
                  <MapPin className="w-[15px] h-[15px] text-black fill-black" />
                  <span className="font-bold text-slate-900">Connected Rido Clans</span>
                </div>
                <div className="h-3 w-px bg-slate-200 shrink-0" />
                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="w-4 h-0.5 border-b-2 border-dashed border-red-500 inline-block" />
                  <span className="font-semibold text-red-600">Active Feud Line (vs)</span>
                </div>
                <div className="h-3 w-px bg-slate-200 shrink-0" />
                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="w-4 h-0.5 border-b-2 border-dashed border-emerald-500 inline-block" />
                  <span className="font-semibold text-emerald-600">MILF Affiliated Link (affiliated)</span>
                </div>
                <div className="h-3 w-px bg-slate-200 shrink-0" />
                <div className="flex items-center space-x-1 shrink-0">
                  <span className="text-slate-500">Feud Cases:</span>
                  <span className="font-bold text-blue-700">{filteredRidos.length}</span>
                </div>
              </div>
            </div>
          </div>

          

          {/* ── Table View: Display all Rido entries fetched from Supabase ── */}
          {ridoViewMode === 'table' ? (
            <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500 font-semibold tracking-wider">
                    <th className="py-3 px-3.5 min-w-[200px]">Party A (Family Clan A)</th>
                    <th className="py-3 px-3.5 min-w-[200px]">Party B (Family Clan B)</th>
                    <th className="py-3 px-3.5 min-w-[180px]">Conflict Location</th>
                    <th className="py-3 px-3.5 min-w-[150px]">Root Cause</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Casualties</th>
                    <th className="py-3 px-3.5 min-w-[180px]">Mediating Agency</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap sticky right-0 bg-slate-50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRidos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Scale className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">No Rido Cases Found</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {ridoSearch || ridoStatusFilter !== 'all'
                            ? 'No conflict records match your search or filter criteria.'
                            : 'No Rido entries recorded in Supabase. Click "+ Add Rido Personality & Location" to log a clan dispute.'}
                        </p>
                        <button
                          onClick={() => {
                            setEditingRido(null);
                            setIsRidoModalOpen(true);
                          }}
                          className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Rido Entry</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredRidos.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Party A Column */}
                        <td className="py-3 px-3.5 align-top">
                          <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            <span className="leading-tight text-blue-950 font-bold">{r.party_a || r.feuding_parties?.split(/vs\.?|—/i)[0]?.trim() || 'Party A'}</span>
                          </div>
                          {r.party_a_affiliation && (
                            <div className="mt-1">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                                {r.party_a_affiliation}
                              </span>
                            </div>
                          )}
                          {r.party_a_personalities && (
                            <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Key Personnel:</span>
                              <span>{r.party_a_personalities}</span>
                            </div>
                          )}
                        </td>

                        {/* Party B Column */}
                        <td className="py-3 px-3.5 align-top">
                          <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                            <span className="leading-tight text-slate-900 font-bold">{r.party_b || r.feuding_parties?.split(/vs\.?|—/i)[1]?.trim() || 'Party B'}</span>
                          </div>
                          {r.party_b_affiliation && (
                            <div className="mt-1">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-block">
                                {r.party_b_affiliation}
                              </span>
                            </div>
                          )}
                          {r.party_b_personalities && (
                            <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Key Personnel:</span>
                              <span>{r.party_b_personalities}</span>
                            </div>
                          )}
                        </td>

                        {/* Conflict Location (No MGRS) */}
                        <td className="py-3 px-3.5 text-slate-700 align-top">
                          <div className="flex items-start space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium text-slate-900 leading-tight">
                                {r.barangay ? `${r.barangay}, ${r.municipality}` : r.municipality}
                              </div>
                              {r.address && r.address !== `${r.barangay}, ${r.municipality}` && (
                                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1" title={r.address}>
                                  {r.address}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400 mt-0.5">{r.province}</div>
                            </div>
                          </div>
                        </td>

                        {/* Root Cause */}
                        <td className="py-3 px-3.5 text-slate-800 font-medium align-top">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] inline-block">
                            {r.root_cause}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 whitespace-nowrap align-top">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getStatusBadge(r.status)}`}>
                            {r.status}
                          </span>
                        </td>

                        {/* Casualties */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-700 text-[11px] align-top">
                          <span className="font-semibold text-slate-900">{r.fatalities_count || 0}</span> KIA •{' '}
                          <span className="font-semibold text-slate-900">{r.wounded_count || 0}</span> WIA
                        </td>

                        {/* Mediating Agency */}
                        <td className="py-3 px-3.5 text-slate-700 align-top">
                          <div className="truncate max-w-[180px]" title={r.mediating_agency}>
                            {r.mediating_agency}
                          </div>
                          {r.lead_mediator && (
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]" title={r.lead_mediator}>
                              Lead: {r.lead_mediator}
                            </div>
                          )}
                        </td>

                        {/* Action Buttons in right portion */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-4px_0_6px_rgba(0,0,0,0.03)] align-top">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleLocateRidoOnMap(r)}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-semibold transition-colors"
                              title="Locate Feud on Map"
                            >
                              <MapPin className="w-3 h-3 text-blue-600" />
                              <span>Locate</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingRido(r);
                                setIsRidoModalOpen(true);
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
                              title="Edit Rido Entry"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteRido(r.id, r.case_code)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors"
                              title="Delete Rido Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Briefing Cards View (Separated Party A & Party B, No Case Code, No MGRS Grid) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRidos.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-sm space-y-3 group"
                >
                  {/* Status header (Case Code removed) */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Clan Feud Dossier
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase border shrink-0 ${getStatusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </div>

                  {/* 2-Column Feuding Parties in Card */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    {/* Party A */}
                    <div className="pr-2 border-r border-slate-200">
                      <div className="flex items-center space-x-1 text-[10px] font-bold text-blue-700 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        <span>Party A</span>
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5 leading-tight">
                        {r.party_a || r.feuding_parties?.split(/vs\.?|—/i)[0]?.trim() || 'Party A'}
                      </div>
                      {r.party_a_affiliation && (
                        <span className="mt-1 inline-block px-1 py-0.2 rounded text-[9px] font-semibold bg-blue-100/70 text-blue-800">
                          {r.party_a_affiliation}
                        </span>
                      )}
                      {r.party_a_personalities && (
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                          {r.party_a_personalities}
                        </p>
                      )}
                    </div>

                    {/* Party B */}
                    <div className="pl-1">
                      <div className="flex items-center space-x-1 text-[10px] font-bold text-rose-700 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        <span>Party B</span>
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5 leading-tight">
                        {r.party_b || r.feuding_parties?.split(/vs\.?|—/i)[1]?.trim() || 'Party B'}
                      </div>
                      {r.party_b_affiliation && (
                        <span className="mt-1 inline-block px-1 py-0.2 rounded text-[9px] font-semibold bg-rose-100/70 text-rose-800">
                          {r.party_b_affiliation}
                        </span>
                      )}
                      {r.party_b_personalities && (
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                          {r.party_b_personalities}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Conflict Location & Cause (MGRS removed) */}
                  <div className="space-y-1 text-xs text-slate-700">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-600">{r.address || `${r.barangay}, ${r.municipality}`}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Cause: <strong className="text-slate-700">{r.root_cause}</strong></span>
                      <span>{r.fatalities_count} KIA • {r.wounded_count} WIA</span>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {r.mediating_agency}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleLocateRidoOnMap(r)}
                        className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-semibold"
                        title="Locate Feud on Map"
                      >
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <span>Locate</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingRido(r);
                          setIsRidoModalOpen(true);
                        }}
                        className="flex items-center space-x-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteRido(r.id, r.case_code)}
                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 2: PIAGs LOCATION TAB ───────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'piags' && (
        <div className="space-y-4 font-sans">
          {/* Stat Cards */}
      

          {/* ── TACTICAL GEOSPATIAL MAP RADAR ─────────────────────────────────── */}
          <div
            id="piag-tactical-map-container"
            className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Map Card Header */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 shadow-sm">
                  <Crosshair className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      PIAGs Staging Locations and Strongholds
                    </h3>
    
                  </div>
                
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => {
                    setPiagMapCenter([6.9536, 124.4756]);
                    setPiagMapZoom(8);
                    setFocusedPiagId(null);
                  }}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors shadow-sm"
                  title="Reset Map View to AOR Center"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reset AOR View</span>
                </button>

                <button
                  onClick={() => {
                    setEditingPiag(null);
                    setIsPiagModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add PIAG Location</span>
                </button>
              </div>
            </div>

            {/* Tactical Map Display */}
            <div className="relative isolate z-0">
              <TacticalMap
                records={piagMapRecords}
                onSelectRecord={(rec) => {
                  setFocusedPiagId(rec.id);
                  const matchingPiag = piagRecords.find((p) => p.id === rec.id);
                  if (matchingPiag && matchingPiag.lat && matchingPiag.lng) {
                    setPiagMapCenter([Number(matchingPiag.lat), Number(matchingPiag.lng)]);
                    setPiagMapZoom(13);
                  }
                }}
                center={piagMapCenter}
                zoom={piagMapZoom}
                focusedRecordId={focusedPiagId}
                className="h-[650px] w-full"
                isLive={true}
                onRefresh={loadAllCMOData}
              />

              {/* Tactical Legend Overlay */}
              <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-1.5 shadow-md flex items-center space-x-3 text-[11px] text-slate-700 font-medium max-w-[90%] overflow-x-auto">
                <div className="flex items-center space-x-1.5 shrink-0">
                  <MapPin className="w-[15px] h-[15px] text-red-600 fill-red-500" />
                  <span className="font-semibold text-red-600">MNLF</span>
                </div>
                <div className="h-3 w-px bg-slate-200 shrink-0" />
                <div className="flex items-center space-x-1.5 shrink-0">
                  <MapPin className="w-[15px] h-[15px] text-emerald-600 fill-emerald-500" />
                  <span className="font-semibold text-emerald-600">MILF</span>
                </div>
                <div className="h-3 w-px bg-slate-200 shrink-0" />
                <div className="flex items-center space-x-1 shrink-0">
                  <span className="text-slate-500">Plotted:</span>
                  <span className="font-bold text-blue-700">{piagMapRecords.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search PIAG group name, leader, location, MGRS..."
                  value={piagSearch}
                  onChange={(e) => setPiagSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <select
                value={piagStatusFilter}
                onChange={(e) => setPiagStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="all">All Tracking Statuses</option>
                <option value="Active">Active</option>
                <option value="Monitored">Monitored</option>
                <option value="Dormant">Dormant</option>
                <option value="Disbanded">Disbanded</option>
              </select>

              <select
                value={piagThreatFilter}
                onChange={(e) => setPiagThreatFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="all">All Threat Levels</option>
                <option value="critical">Critical Threat</option>
                <option value="high">High Threat</option>
                <option value="medium">Medium Threat</option>
                <option value="low">Low Threat</option>
              </select>

              <button
                onClick={loadAllCMOData}
                disabled={isRefreshing}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs border border-slate-200 transition-colors"
                title="Refresh PIAG data from Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                <span>Sync</span>
              </button>

              {piagRecords.length > 0 && (
                <button
                  onClick={handleClearAllPiags}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs border border-rose-200 transition-colors font-medium"
                  title="Remove all PIAG locations"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => {
                  setEditingPiag(null);
                  setIsPiagModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add PIAG Location</span>
              </button>
            </div>
          </div>

          {/* PIAGs Table */}
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500 font-semibold tracking-wider">
                  <th className="py-3 px-3.5">Group / Element</th>
                  <th className="py-3 px-3.5">Commander / Leader</th>
                  <th className="py-3 px-3.5">Political Faction</th>
                  <th className="py-3 px-3.5">Armed Strength</th>
                  <th className="py-3 px-3.5">Location &amp; Area</th>
                  <th className="py-3 px-3.5">MGRS Grid</th>
                  <th className="py-3 px-3.5">Threat &amp; Status</th>
                  <th className="py-3 px-3.5 text-right sticky right-0 bg-slate-50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPiags.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Crosshair className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No PIAG Locations Recorded</p>
                      <p className="text-xs text-slate-400 mt-0.5">Click "+ Add PIAG Location" to manually pin and record Private Armed Group staging elements.</p>
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            setEditingPiag(null);
                            setIsPiagModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100 transition-colors"
                        >
                          + Manually Add PIAG Location
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPiags.map((p) => {
                    const isFocused = focusedPiagId === p.id;
                    const isMnlf = (p.group_name || '').toUpperCase().includes('MNLF');
                    const groupDisplay = isMnlf ? 'MNLF' : 'MILF';
                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleLocatePiagOnMap(p)}
                        className={`transition-colors cursor-pointer group ${
                          isFocused ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3.5">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                isMnlf
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {groupDisplay}
                            </span>
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {p.group_name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            PIAG-{p.group_name.slice(0, 6).toUpperCase()}
                          </div>
                        </td>

                        <td className="py-3 px-3.5 text-slate-800 font-medium">
                          <div>{p.commander_leader}</div>
                          {(p.notes || p.remarks) && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={p.notes || p.remarks}>
                              {p.notes || p.remarks}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-slate-600">
                          {p.affiliated_politician_faction || 'Independent / None'}
                        </td>

                        <td className="py-3 px-3.5 text-slate-800">
                          <div className="font-semibold text-rose-700">{p.estimated_strength}</div>
                          {(p.total_est_firearms || p.firearms_inventory) && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={p.total_est_firearms || p.firearms_inventory}>
                              {p.total_est_firearms || p.firearms_inventory}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-slate-700">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{p.address || `${p.barangay}, ${p.municipality}`}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{p.province}</div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="flex items-center space-x-1">
                            <span className="font-mono text-[11px] font-bold text-blue-700">{p.mgrs}</span>
                            {p.mgrs && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(p.mgrs || '', `piag-${p.id}`);
                                }}
                                className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                                title="Copy MGRS Grid"
                              >
                                {copiedKey === `piag-${p.id}` ? (
                                  <Check className="w-3 h-3 text-blue-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                p.status === 'Active'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : p.status === 'Monitored'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {p.status}
                            </span>
                            {p.threat_level && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase ${
                                  p.threat_level === 'critical'
                                    ? 'bg-red-100 text-red-800'
                                    : p.threat_level === 'high'
                                    ? 'bg-amber-50 text-amber-800'
                                    : 'bg-slate-50 text-slate-600'
                                }`}
                              >
                                {p.threat_level} Threat
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3.5 text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-4px_0_6px_rgba(0,0,0,0.03)]">
                          <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleLocatePiagOnMap(p)}
                              className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200 transition-colors"
                              title="Locate on Tactical Map"
                            >
                              <MapPin className="w-3 h-3 text-blue-600" />
                              <span>Locate</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingPiag(p);
                                setIsPiagModalOpen(true);
                              }}
                              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors"
                              title="Edit PIAG Entry"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePiag(p.id)}
                              className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors"
                              title="Delete PIAG Entry"
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
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 3: CMO ACTIVITIES TAB ───────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'cmo_activities' && (
        <div className="space-y-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Activities</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{activityStats.total}</div>
              <div className="text-xs text-slate-400 mt-0.5">Logged Operations</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Completed Outreach</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">{activityStats.completed}</div>
              <div className="text-xs text-slate-400 mt-0.5">Successful implementations</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Beneficiaries</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{activityStats.beneficiaries}</div>
              <div className="text-xs text-slate-400 mt-0.5">Civilians assisted</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Inter-Agency Partnering</div>
              <div className="text-sm font-bold text-blue-700 mt-2 flex items-center space-x-1.5">
                <HeartHandshake className="w-4 h-4 text-blue-600" />
                <span>WHOLE-OF-NATION</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">LGU &amp; NGO Synergy</div>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search activity title, program type, community, implementing unit..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <select
                value={activityStatusFilter}
                onChange={(e) => setActivityStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="all">All Execution Statuses</option>
                <option value="Planned">Planned</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingActivity(null);
                setIsActivityModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log CMO Activity</span>
            </button>
          </div>

          {/* CMO Activities Table */}
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500 font-semibold tracking-wider">
                  <th className="py-3 px-3.5">Activity Title</th>
                  <th className="py-3 px-3.5">Program Type</th>
                  <th className="py-3 px-3.5">Target Community / Area</th>
                  <th className="py-3 px-3.5">Implementing Unit</th>
                  <th className="py-3 px-3.5">Beneficiaries</th>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right sticky right-0 bg-slate-50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No CMO Activities Logged</p>
                      <p className="text-xs text-slate-400 mt-0.5">Click "+ Log CMO Activity" to record a medical outreach, summit, or peace dialogue.</p>
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-slate-900">{a.activity_title}</td>
                      <td className="py-3 px-3.5 text-blue-700 font-medium">{a.activity_type}</td>
                      <td className="py-3 px-3.5 text-slate-700">{a.target_community}</td>
                      <td className="py-3 px-3.5 text-slate-600">{a.implementing_unit}</td>
                      <td className="py-3 px-3.5 font-bold text-slate-800">{a.beneficiaries_count}</td>
                      <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">{a.activity_date}</td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          a.status === 'Completed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right sticky right-0 bg-white">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingActivity(a);
                              setIsActivityModalOpen(true);
                            }}
                            className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(a.id)}
                            className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── MODALS: RidoModal, PIAGModal, CMOActivityModal ───────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <RidoModal
        isOpen={isRidoModalOpen}
        onClose={() => setIsRidoModalOpen(false)}
        onSave={handleSaveRido}
        initialData={editingRido}
      />

      <PIAGModal
        isOpen={isPiagModalOpen}
        onClose={() => setIsPiagModalOpen(false)}
        onSave={handleSavePiag}
        initialData={editingPiag}
      />

      <CMOActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSave={handleSaveActivity}
        initialData={editingActivity}
      />

    </div>
  );
}


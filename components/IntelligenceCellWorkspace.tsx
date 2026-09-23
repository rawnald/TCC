'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RecordItem, RecordCategory, RecordStatus, RecordPriority } from '@/types';
import DIBModal, { DIBRecord } from './DIBModal';
import EnemyLocationModal, { EnemyLocationRecord } from './EnemyLocationModal';
import EnemyProfileModal, { EnemyProfileRecord, THREAT_GROUPS } from './EnemyProfileModal';
import TacticalMap from './TacticalMap';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { toZuluDTG, parseMGRSToCoords, toMGRS } from '@/lib/mgrsUtils';
import {
  FileText,
  Crosshair,
  Skull,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Copy,
  Check,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  Shield,
  Eye,
  Activity,
  Layers,
  ChevronRight,
  ExternalLink,
  Printer,
  Calendar,
  Clock,
  Radio,
  Navigation,
  Compass,
  ArrowUpRight,
  Edit,
  Trash2,
  Table,
  LayoutGrid,
  X,
  Target,
} from 'lucide-react';

export type IntelNavTab = 'dib' | 'enemy_location' | 'enemy_profiling';

interface IntelligenceCellWorkspaceProps {
  records: RecordItem[];
  onSelectRecord: (record: RecordItem) => void;
  onOpenCreate: (category?: RecordCategory) => void;
  onSaveRecord?: (record: Partial<RecordItem>) => Promise<void> | void;
  onDeleteRecord?: (id: string) => Promise<void> | void;
  onRefreshData?: () => Promise<void> | void;
  dutyOfficer?: string;
  callsign?: string;
}

export default function IntelligenceCellWorkspace({
  records,
  onSelectRecord,
  onOpenCreate,
  onSaveRecord,
  onDeleteRecord,
  onRefreshData,
  dutyOfficer = 'Capt. Elena Rostova',
  callsign = 'ORACLE-LEAD',
}: IntelligenceCellWorkspaceProps) {
  // ── Horizontal Navigation State ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<IntelNavTab>('dib');

  // ── DIB (Daily Intelligence Bulletin) State (Direct Supabase, no localStorage) ──
  const [dibRecords, setDibRecords] = useState<DIBRecord[]>([]);
  const [isDibModalOpen, setIsDibModalOpen] = useState(false);
  const [editingDib, setEditingDib] = useState<DIBRecord | null>(null);
  const [viewingDib, setViewingDib] = useState<DIBRecord | null>(null);
  const [dibSearch, setDibSearch] = useState('');
  const [dibTypeFilter, setDibTypeFilter] = useState<string>('all');
  const [dibThreatGroupFilter, setDibThreatGroupFilter] = useState<string>('all');
  const [dibMotiveFilter, setDibMotiveFilter] = useState<string>('all');
  const [dibViewMode, setDibViewMode] = useState<'table' | 'cards'>('table');

  // ── Latest Enemy Location State ────────────────────────────────────────────
  const [enemyLocations, setEnemyLocations] = useState<EnemyLocationRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('intel_enemy_locations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isEnemyLocModalOpen, setIsEnemyLocModalOpen] = useState(false);
  const [editingEnemyLoc, setEditingEnemyLoc] = useState<EnemyLocationRecord | null>(null);
  const [selectedEnemyLoc, setSelectedEnemyLoc] = useState<EnemyLocationRecord | null>(null);
  const [enemyLocSearch, setEnemyLocSearch] = useState('');
  const [enemyLocThreatFilter, setEnemyLocThreatFilter] = useState<string>('all');
  const [enemyLocStatusFilter, setEnemyLocStatusFilter] = useState<string>('all');
  const [copiedMgrs, setCopiedMgrs] = useState<string | null>(null);
  const [mapFocusedId, setMapFocusedId] = useState<string | null>(null);
  const [sidePanelTab, setSidePanelTab] = useState<'hvt' | 'dib'>('hvt');
  const [selectedDibId, setSelectedDibId] = useState<string | null>(null);

  // ── Enemy Profiling/Status State (Supabase enemy_profiles table) ─────────
  const DEFAULT_ENEMY_PROFILES: EnemyProfileRecord[] = [
    {
      id: 'e01a1111-2222-4000-8000-000000000001',
      true_name: 'Abdul Malik Usman',
      alias: 'Commander Abu Jihad',
      threat_group: 'BIFF',
      position_role: 'Sub-Leader / Operations Head',
      address: 'Sitio Balas, Brgy. Poblacion, Datu Piang, Maguindanao del Sur',
      province: 'Maguindanao del Sur',
      municipality: 'Datu Piang (Dulawan)',
      barangay: 'Poblacion',
      purok_sitio: 'Sitio Balas',
      picture_url: '',
      value: 'HVI',
      psr: 'PSR-2026-0881',
      latest_location_mgrs: '51NXH6659745322',
      lat: 7.0284,
      lng: 124.4981,
      created_at: '2026-09-17T08:00:00.000Z',
    },
    {
      id: 'e01a1111-2222-4000-8000-000000000002',
      true_name: 'Norodin Pendatun Sula',
      alias: 'Kumander Falcon',
      threat_group: 'DIHG',
      position_role: 'IED Specialist / Logistics Courier',
      address: 'Purok 3, Brgy. Dalican, Datu Odin Sinsuat, Maguindanao del Norte',
      province: 'Maguindanao del Norte',
      municipality: 'Datu Odin Sinsuat (Dinaig)',
      barangay: 'Dalican',
      purok_sitio: 'Purok 3',
      picture_url: '',
      value: 'HVI',
      psr: 'PSR-2026-1042',
      latest_location_mgrs: '51NXH1647732345',
      lat: 7.1523,
      lng: 124.2814,
      created_at: '2026-09-17T09:30:00.000Z',
    },
    {
      id: 'e01a1111-2222-4000-8000-000000000003',
      true_name: 'Hassan Guinaid Karim',
      alias: 'Black Eye',
      threat_group: 'PAGs',
      position_role: 'Enforcer / Armed Combatant',
      address: 'Purok 1, Brgy. Sambulawan, Midsayap, Cotabato',
      province: 'Cotabato',
      municipality: 'Midsayap',
      barangay: 'Sambulawan',
      purok_sitio: 'Purok 1',
      picture_url: '',
      value: 'Non-HVI',
      psr: 'PSR-2026-0419',
      latest_location_mgrs: '51NXH8394780402',
      lat: 7.1954,
      lng: 124.5312,
      created_at: '2026-09-17T11:15:00.000Z',
    },
  ];

  const [enemyProfiles, setEnemyProfiles] = useState<EnemyProfileRecord[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_ENEMY_PROFILES;
    try {
      const stored = localStorage.getItem('intel_enemy_profiles');
      return stored ? JSON.parse(stored) : DEFAULT_ENEMY_PROFILES;
    } catch {
      return DEFAULT_ENEMY_PROFILES;
    }
  });
  const [isEnemyProfileModalOpen, setIsEnemyProfileModalOpen] = useState(false);
  const [editingEnemyProfile, setEditingEnemyProfile] = useState<EnemyProfileRecord | null>(null);
  const [viewingEnemyProfile, setViewingEnemyProfile] = useState<EnemyProfileRecord | null>(null);
  const [profileSearch, setProfileSearch] = useState('');
  const [profileThreatFilter, setProfileThreatFilter] = useState<string>('all');
  const [profileValueFilter, setProfileValueFilter] = useState<string>('all');
  const [profileViewMode, setProfileViewMode] = useState<'cards' | 'table'>('table');
  const [supabaseTableNotice, setSupabaseTableNotice] = useState<string | null>(null);

  // Global refresh indicator
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Load & Sync from Supabase on mount ─────────────────────────────────────
  const loadIntelDataFromSupabase = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    setIsRefreshing(true);
    try {
      // 1. Fetch DIB records strictly from Supabase 'intel_dib' table (or fallback to 'records')
      try {
        const { data: dibData, error: dibErr } = await supabase
          .from('intel_dib')
          .select('*')
          .order('created_at', { ascending: false });

        if (dibData && !dibErr) {
          setDibRecords(dibData);
        } else {
          if (dibErr) {
            console.warn('Supabase intel_dib query notice:', dibErr.message);
          }
          // Fallback to records table
          const { data: recData } = await supabase
            .from('records')
            .select('*')
            .eq('category', 'reports')
            .order('created_at', { ascending: false });
          if (recData && recData.length > 0) {
            const mapped: DIBRecord[] = recData
              .filter((r: any) => r.metadata?.intel_type === 'dib')
              .map((r: any) => ({
                id: r.id,
                dib_id: r.metadata?.dib_id || r.code || `DIB-${r.id.slice(0, 6)}`,
                activity: r.metadata?.activity || r.description || '',
                details: r.metadata?.details || '',
                datetime: r.metadata?.datetime || toZuluDTG(r.created_at),
                mgrs: r.metadata?.mgrs || toMGRS(Number(r.lat) || 7.22, Number(r.lng) || 124.24),
                threat_group: r.metadata?.threat_group || 'BIFF',
                threat_group_other: r.metadata?.threat_group_other,
                personality_victim: r.metadata?.personality_victim || 'N/A',
                motive: r.metadata?.motive || 'Undetermined',
                source_evaluation: r.metadata?.source_evaluation || 'Direct Field Report',
                type: r.metadata?.type || 'Violent',
                address: r.location_name || r.metadata?.address || 'General Theater',
                province: r.metadata?.province || '',
                municipality: r.metadata?.municipality || '',
                barangay: r.metadata?.barangay || '',
                purok_sitio: r.metadata?.purok_sitio || '',
                lat: Number(r.lat) || 7.22,
                lng: Number(r.lng) || 124.24,
                created_at: r.created_at,
                updated_at: r.updated_at,
              }));
            setDibRecords(mapped);
          }
        }
      } catch (e) {
        console.warn('Supabase DIB load notice:', e);
      }

      // 2. Fetch Latest Enemy Locations from 'intel_enemy_locations' table or 'records'
      try {
        const { data: locData } = await supabase
          .from('intel_enemy_locations')
          .select('*')
          .order('created_at', { ascending: false });
        if (locData && locData.length > 0) {
          setEnemyLocations(locData);
          localStorage.setItem('intel_enemy_locations', JSON.stringify(locData));
        } else {
          // Fallback to records table
          const { data: recData } = await supabase
            .from('records')
            .select('*')
            .order('created_at', { ascending: false });
          if (recData && recData.length > 0) {
            const mappedLocs = recData
              .filter(
                (r: any) =>
                  r.metadata?.intel_type === 'enemy_location' ||
                  r.metadata?.is_hostile === true ||
                  r.metadata?.is_enemy_sighting === true
              )
              .map((r: any) => ({
                id: r.id,
                hostile_element: r.title,
                group_affiliation: r.metadata?.group_affiliation || 'Hostile Element',
                sighting_dtg: r.metadata?.sighting_dtg || toZuluDTG(r.created_at),
                province_area: r.location_name || 'Theater Grid',
                mgrs: r.metadata?.mgrs || toMGRS(Number(r.lat) || 7.22, Number(r.lng) || 124.24),
                lat: Number(r.lat) || 7.22,
                lng: Number(r.lng) || 124.24,
                strength: r.metadata?.strength || 'Unspecified',
                weapons: r.metadata?.weapons || 'Small arms',
                activity: r.description || 'Observed presence',
                movement_vector: r.metadata?.movement_vector || 'Stationary',
                confidence: r.metadata?.confidence || 'Confirmed',
                threat_level: r.priority || 'high',
                status: r.metadata?.tracking_status || 'active_tracking',
                notes: r.metadata?.notes || '',
                reported_by: r.metadata?.reported_by || dutyOfficer,
                created_at: r.created_at,
                updated_at: r.updated_at,
              }));
            if (mappedLocs.length > 0) {
              setEnemyLocations(mappedLocs);
              localStorage.setItem('intel_enemy_locations', JSON.stringify(mappedLocs));
            }
          }
        }
      } catch (e) {
        console.warn('Supabase Enemy Locations load notice:', e);
      }

      // 3. Fetch Enemy Profiles strictly from Supabase 'enemy_profiles' table or fallback to 'records'
      try {
        const { data: profData, error: profErr } = await supabase
          .from('enemy_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profData && !profErr) {
          if (profData.length > 0) {
            setEnemyProfiles(profData);
            try {
              localStorage.setItem('intel_enemy_profiles', JSON.stringify(profData));
            } catch {
              /* silent */
            }
          }
          setSupabaseTableNotice(null);
        } else {
          if (profErr) {
            if (profErr.message.includes('Could not find the table') || profErr.code === '42P01') {
              setSupabaseTableNotice(
                'Supabase table "public.enemy_profiles" has not been created yet in your Supabase SQL Editor. Click "Copy Supabase SQL" below and run it in Supabase to enable cloud sync.'
              );
            } else {
              console.warn('Supabase enemy_profiles query notice:', profErr.message);
            }
          }
          // Fallback to records table (support reports category and legacy personnel)
          const { data: recData } = await supabase
            .from('records')
            .select('*')
            .in('category', ['reports', 'personnel'])
            .order('created_at', { ascending: false });

          if (recData && recData.length > 0) {
            const mappedProfiles: EnemyProfileRecord[] = recData
              .filter(
                (r: any) =>
                  r.metadata?.intel_type === 'enemy_profile' ||
                  r.metadata?.is_enemy_profile === true
              )
              .map((r: any) => ({
                id: r.id,
                true_name: r.metadata?.true_name || r.title || 'Unknown Subject',
                alias: r.metadata?.alias || r.code || '',
                threat_group: r.metadata?.threat_group || 'BIFF',
                threat_group_other: r.metadata?.threat_group_other || '',
                position_role: r.metadata?.position_role || '',
                address: r.location_name || r.metadata?.address || '',
                province: r.metadata?.province || '',
                municipality: r.metadata?.municipality || '',
                barangay: r.metadata?.barangay || '',
                purok_sitio: r.metadata?.purok_sitio || '',
                picture_url: r.metadata?.picture_url || '',
                value: r.metadata?.value || 'HVI',
                psr: r.metadata?.psr || '',
                latest_location_mgrs: r.metadata?.latest_location_mgrs || r.metadata?.mgrs || '',
                lat: Number(r.lat) || 7.2236,
                lng: Number(r.lng) || 124.2464,
                created_at: r.created_at,
                updated_at: r.updated_at,
              }));
            if (mappedProfiles.length > 0) {
              setEnemyProfiles(mappedProfiles);
              try {
                localStorage.setItem('intel_enemy_profiles', JSON.stringify(mappedProfiles));
              } catch {
                /* silent */
              }
            }
          }
        }
      } catch (e) {
        console.warn('Supabase Enemy Profiles load notice:', e);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Purge legacy DIB cache only
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('intel_dib_records');
      } catch {
        /* silent */
      }
    }

    loadIntelDataFromSupabase();

    if (!isSupabaseConfigured() || !supabase) return;

    // Real-time live synchronization on Supabase public.intel_dib table
    const dibChannel = supabase
      .channel('realtime_intel_dib')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'intel_dib' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as DIBRecord;
            setDibRecords((prev) => {
              if (prev.some((r) => r.id === newRecord.id)) return prev;
              return [newRecord, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as DIBRecord;
            setDibRecords((prev) =>
              prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id?: string })?.id;
            if (deletedId) {
              setDibRecords((prev) => prev.filter((r) => r.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    // Real-time live synchronization on Supabase public.enemy_profiles table
    const enemyProfileChannel = supabase
      .channel('realtime_enemy_profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enemy_profiles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as EnemyProfileRecord;
            setEnemyProfiles((prev) => {
              if (prev.some((r) => r.id === newRecord.id)) return prev;
              return [newRecord, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as EnemyProfileRecord;
            setEnemyProfiles((prev) =>
              prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id?: string })?.id;
            if (deletedId) {
              setEnemyProfiles((prev) => prev.filter((r) => r.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    // Real-time live synchronization on Supabase public.intel_enemy_locations table
    const enemyLocChannel = supabase
      .channel('realtime_intel_enemy_locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'intel_enemy_locations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as EnemyLocationRecord;
            setEnemyLocations((prev) => {
              if (prev.some((r) => r.id === newRecord.id)) return prev;
              const updated = [newRecord, ...prev];
              localStorage.setItem('intel_enemy_locations', JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as EnemyLocationRecord;
            setEnemyLocations((prev) => {
              const updated = prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
              localStorage.setItem('intel_enemy_locations', JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id?: string })?.id;
            if (deletedId) {
              setEnemyLocations((prev) => {
                const updated = prev.filter((r) => r.id !== deletedId);
                localStorage.setItem('intel_enemy_locations', JSON.stringify(updated));
                return updated;
              });
            }
          }
        }
      )
    // Refetch when the user returns to the dashboard tab instead of aggressive 10s polling
    const handleFocus = () => {
      loadIntelDataFromSupabase();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (supabase) {
        supabase.removeChannel(dibChannel);
        supabase.removeChannel(enemyProfileChannel);
        supabase.removeChannel(enemyLocChannel);
      }
    };
  }, []);

  // ── Save & Delete Handlers for DIB (Direct to Supabase, no localStorage) ───
  const handleSaveDIB = async (bulletin: DIBRecord) => {
    // Optimistically update UI state and switch to table view immediately
    const isEdit = dibRecords.some((b) => b.id === bulletin.id);
    const updated = isEdit
      ? dibRecords.map((b) => (b.id === bulletin.id ? bulletin : b))
      : [bulletin, ...dibRecords];
    setDibRecords(updated);
    setDibViewMode('table'); // Display table after saving

    // Direct Supabase synchronization
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('intel_dib').upsert([bulletin]);
        if (error) {
          console.warn('Supabase intel_dib upsert notice:', error.message);
        }
      } catch (err) {
        console.warn('Supabase intel_dib save notice:', err);
      }

      // Mirror to unified records table for cross-cell tactical map markers
      try {
        const recordMirror: Partial<RecordItem> = {
          id: bulletin.id,
          code: bulletin.dib_id,
          title: `[${bulletin.type.toUpperCase()}] ${bulletin.threat_group} — ${bulletin.activity.slice(0, 50)}`,
          category: 'reports',
          description: bulletin.details ? `${bulletin.activity} — ${bulletin.details}` : bulletin.activity,
          status: 'active',
          priority: bulletin.type === 'Violent' ? 'high' : 'medium',
          lat: bulletin.lat || 7.2236,
          lng: bulletin.lng || 124.2464,
          location_name: bulletin.address,
          metadata: {
            intel_type: 'dib',
            dib_id: bulletin.dib_id,
            activity: bulletin.activity,
            details: bulletin.details,
            datetime: bulletin.datetime,
            mgrs: bulletin.mgrs,
            threat_group: bulletin.threat_group,
            threat_group_other: bulletin.threat_group_other,
            personality_victim: bulletin.personality_victim,
            motive: bulletin.motive,
            source_evaluation: bulletin.source_evaluation,
            type: bulletin.type,
            address: bulletin.address,
            province: bulletin.province,
            municipality: bulletin.municipality,
            barangay: bulletin.barangay,
            purok_sitio: bulletin.purok_sitio,
          },
          updated_at: new Date().toISOString(),
        };
        await supabase.from('records').upsert([recordMirror]);
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.warn('Supabase records mirror failed:', err);
      }
    }
  };

  const handleDeleteDIB = async (id: string) => {
    if (!confirm('Permanently purge this Daily Intelligence Bulletin record from Supabase?')) return;
    setDibRecords((prev) => prev.filter((b) => b.id !== id));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('intel_dib').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase intel_dib delete notice:', err);
      }
      try {
        await supabase.from('records').delete().eq('id', id);
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.warn('Supabase records delete notice:', err);
      }
    }
  };

  // ── Save & Delete Handlers for Enemy Location ─────────────────────────────
  const handleSaveEnemyLocation = async (loc: EnemyLocationRecord) => {
    const isEdit = enemyLocations.some((l) => l.id === loc.id);
    const updated = isEdit
      ? enemyLocations.map((l) => (l.id === loc.id ? loc : l))
      : [loc, ...enemyLocations];
    setEnemyLocations(updated);
    localStorage.setItem('intel_enemy_locations', JSON.stringify(updated));
    setSelectedEnemyLoc(loc);

    // Supabase synchronization
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('intel_enemy_locations').upsert([loc]);
      } catch {
        /* proceed to records mirror */
      }
      try {
        const recordMirror: Partial<RecordItem> = {
          id: loc.id,
          code: `ENY-${loc.mgrs.slice(0, 8)}`,
          title: loc.hostile_element,
          category: 'reports',
          description: loc.activity,
          status: loc.status === 'neutralized' || loc.status === 'cleared' ? 'closed' : 'active',
          priority: loc.threat_level,
          lat: loc.lat,
          lng: loc.lng,
          location_name: loc.province_area,
          metadata: {
            intel_type: 'enemy_location',
            is_hostile: true,
            is_enemy_sighting: true,
            group_affiliation: loc.group_affiliation,
            sighting_dtg: loc.sighting_dtg,
            mgrs: loc.mgrs,
            strength: loc.strength,
            weapons: loc.weapons,
            movement_vector: loc.movement_vector,
            confidence: loc.confidence,
            tracking_status: loc.status,
            notes: loc.notes,
            reported_by: loc.reported_by,
          },
          updated_at: new Date().toISOString(),
        };
        await supabase.from('records').upsert([recordMirror]);
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.warn('Supabase records mirror failed:', err);
      }
    }
  };

  const handleDeleteEnemyLocation = (id: string) => {
    if (!confirm('Delete this hostile location record?')) return;
    const updated = enemyLocations.filter((l) => l.id !== id);
    setEnemyLocations(updated);
    localStorage.setItem('intel_enemy_locations', JSON.stringify(updated));
    if (selectedEnemyLoc?.id === id) {
      setSelectedEnemyLoc(updated[0] || null);
    }

    if (isSupabaseConfigured() && supabase) {
      (async () => {
        try {
          await supabase.from('intel_enemy_locations').delete().eq('id', id);
        } catch {
          /* silent */
        }
        try {
          await supabase.from('records').delete().eq('id', id);
          if (onRefreshData) onRefreshData();
        } catch {
          /* silent */
        }
      })();
    }
  };

  // ── Save & Delete Handlers for Enemy Profile (Direct Supabase enemy_profiles table) ───
  const handleSaveEnemyProfile = async (profile: EnemyProfileRecord) => {
    // 1. Optimistic UI update & immediately display table view
    const isEdit = enemyProfiles.some((p) => p.id === profile.id);
    const updated = isEdit
      ? enemyProfiles.map((p) => (p.id === profile.id ? profile : p))
      : [profile, ...enemyProfiles];
    setEnemyProfiles(updated);
    setProfileViewMode('table'); // Display and fetch data table after saving

    try {
      localStorage.setItem('intel_enemy_profiles', JSON.stringify(updated));
    } catch {
      /* silent */
    }

    // 2. Direct Supabase save to public.enemy_profiles table
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('enemy_profiles').upsert([profile]);
        if (error) {
          console.warn('Supabase enemy_profiles upsert notice:', error.message);
          if (error.message.includes('Could not find the table') || error.code === '42P01') {
            setSupabaseTableNotice(
              'Table "public.enemy_profiles" is not yet created in Supabase. Profiles are safely stored in browser memory & local storage until the SQL table is created.'
            );
          }
        } else {
          setSupabaseTableNotice(null);
        }
      } catch (err) {
        console.warn('Supabase enemy_profiles save error:', err);
      }

      // 3. Mirror to unified records table for cross-cell tactical map and personnel overview
      try {
        const recordMirror: Partial<RecordItem> = {
          id: profile.id,
          code: profile.alias ? `HVT-${profile.alias.toUpperCase().slice(0, 10)}` : `HVT-${profile.id.slice(0, 6)}`,
          title: `${profile.true_name}${profile.alias ? ` ("${profile.alias}")` : ''}`,
          category: 'reports',
          description: `[${profile.threat_group}] Role: ${profile.position_role || 'Unspecified'} | Value: ${profile.value} | PSR: ${profile.psr || 'N/A'} | Location: ${profile.latest_location_mgrs || 'N/A'} | Address: ${profile.address}`,
          status: 'active',
          priority: profile.value === 'HVI' ? 'critical' : 'high',
          lat: profile.lat || 7.2236,
          lng: profile.lng || 124.2464,
          location_name: profile.address || 'Theater Grid',
          metadata: {
            intel_type: 'enemy_profile',
            is_enemy_profile: true,
            is_hostile: true,
            true_name: profile.true_name,
            alias: profile.alias,
            threat_group: profile.threat_group,
            threat_group_other: profile.threat_group_other,
            position_role: profile.position_role,
            address: profile.address,
            province: profile.province,
            municipality: profile.municipality,
            barangay: profile.barangay,
            purok_sitio: profile.purok_sitio,
            picture_url: profile.picture_url,
            value: profile.value,
            psr: profile.psr,
            latest_location_mgrs: profile.latest_location_mgrs,
          },
          updated_at: new Date().toISOString(),
        };
        await supabase.from('records').upsert([recordMirror]);
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.warn('Supabase records mirror notice:', err);
      }
    }
  };

  const handleDeleteEnemyProfile = (id: string, name?: string) => {
    if (!confirm(`Are you sure you want to delete profile for "${name || 'this enemy target'}"?`)) return;
    const updated = enemyProfiles.filter((p) => p.id !== id);
    setEnemyProfiles(updated);
    try {
      localStorage.setItem('intel_enemy_profiles', JSON.stringify(updated));
    } catch {
      /* silent */
    }

    if (viewingEnemyProfile?.id === id) {
      setViewingEnemyProfile(null);
    }

    if (isSupabaseConfigured() && supabase) {
      (async () => {
        try {
          await supabase.from('enemy_profiles').delete().eq('id', id);
        } catch {
          /* silent */
        }
        try {
          await supabase.from('records').delete().eq('id', id);
          if (onRefreshData) onRefreshData();
        } catch {
          /* silent */
        }
      })();
    }
  };

  // ── Convert Enemy Locations into TacticalMap RecordItem format ─────────────
  const enemyMapRecords: RecordItem[] = useMemo(() => {
    return enemyLocations.map((loc) => {
      let lat = loc.lat;
      let lng = loc.lng;
      if (loc.mgrs) {
        const parsed = parseMGRSToCoords(loc.mgrs);
        if (parsed) {
          lat = parsed[0];
          lng = parsed[1];
        }
      }

      return {
        id: loc.id,
        code: `ENY-${loc.mgrs.slice(0, 6)}`,
        title: loc.hostile_element,
        category: 'reports',
        status: 'active',
        priority: loc.threat_level,
        lat,
        lng,
        location_name: loc.province_area,
        description: `[${loc.group_affiliation}] Activity: ${loc.activity}. Observed: ${loc.weapons}. Strength: ${loc.strength}. Movement: ${loc.movement_vector}. Status: ${loc.status.toUpperCase()}`,
        metadata: {
          is_hostile: true,
          intel_type: 'enemy_location',
          mgrs: loc.mgrs,
          group_affiliation: loc.group_affiliation,
          sighting_dtg: loc.sighting_dtg,
          confidence: loc.confidence,
        },
        created_at: loc.created_at,
        updated_at: loc.updated_at || loc.created_at,
      };
    });
  }, [enemyLocations]);

  // ── Convert Enemy Profiles (from enemy_profiles Supabase table) into TacticalMap RecordItem format ──
  // Uses latest_location_mgrs field for precise MGRS-derived coordinates
  const enemyProfileMapRecords: RecordItem[] = useMemo(() => {
    return enemyProfiles
      .filter((prof) => prof.latest_location_mgrs && prof.latest_location_mgrs.trim().length >= 5)
      .map((prof) => {
        let lat = prof.lat || 7.2236;
        let lng = prof.lng || 124.2464;
        // Primary: parse MGRS from latest_location_mgrs for precise coordinates
        if (prof.latest_location_mgrs) {
          const parsed = parseMGRSToCoords(prof.latest_location_mgrs);
          if (parsed) {
            lat = parsed[0];
            lng = parsed[1];
          }
        }

        return {
          id: `prof-${prof.id}`,
          code: prof.psr || `HVT-${prof.id.slice(0, 6)}`,
          title: prof.alias
            ? `${prof.true_name} (${prof.alias})`
            : prof.true_name,
          category: 'personnel' as const,
          status: 'active' as const,
          priority: (prof.value === 'HVI' ? 'critical' : 'high') as any,
          lat,
          lng,
          location_name: prof.address || prof.province || 'Theater Grid',
          description: `[${prof.threat_group}] ${prof.position_role || 'Unknown Role'} | Value: ${prof.value} | PSR: ${prof.psr || 'N/A'} | MGRS: ${prof.latest_location_mgrs}`,
          metadata: {
            is_hostile: true,
            intel_type: 'enemy_profile_location',
            mgrs: prof.latest_location_mgrs,
            threat_group: prof.threat_group,
            value: prof.value,
            psr: prof.psr,
            alias: prof.alias,
            position_role: prof.position_role,
            picture_url: prof.picture_url,
          },
          created_at: prof.created_at,
          updated_at: prof.updated_at || prof.created_at,
        };
      });
  }, [enemyProfiles]);

  // ── Convert DIB Reports (from Supabase intel_dib table) into TacticalMap RecordItem format ──
  // Uses MGRS coordinates parsed via parseMGRSToCoords for accurate tactical positioning
  const dibMapRecords: RecordItem[] = useMemo(() => {
    return dibRecords
      .filter((dib) => (dib.mgrs && dib.mgrs.trim().length >= 5) || (dib.lat && dib.lng))
      .map((dib) => {
        let lat = dib.lat || 7.2236;
        let lng = dib.lng || 124.2464;
        if (dib.mgrs) {
          const parsed = parseMGRSToCoords(dib.mgrs);
          if (parsed) {
            lat = parsed[0];
            lng = parsed[1];
          }
        }

        const locationDisplay =
          [dib.purok_sitio, dib.barangay, dib.municipality, dib.province]
            .filter(Boolean)
            .join(', ') || dib.address || 'Theater Grid';

        return {
          id: `dib-${dib.id}`,
          code: dib.dib_id || `DIB-${dib.id.slice(0, 6)}`,
          title: `[DIB] ${dib.activity}`,
          category: 'reports' as const,
          status: 'active' as const,
          priority: (dib.type === 'Violent' ? 'high' : 'medium') as any,
          lat,
          lng,
          location_name: locationDisplay,
          description: `[${dib.threat_group}] ${dib.details || dib.activity} | Victim/Target: ${dib.personality_victim} | Motive: ${dib.motive} | Source: ${dib.source_evaluation} | MGRS: ${dib.mgrs} | DTG: ${dib.datetime}`,
          metadata: {
            intel_type: 'dib',
            is_dib: true,
            is_flashing: false,
            dib_id: dib.dib_id,
            threat_group: dib.threat_group,
            personality_victim: dib.personality_victim,
            motive: dib.motive,
            source_evaluation: dib.source_evaluation,
            dib_type: dib.type,
            mgrs: dib.mgrs,
            datetime: dib.datetime,
            details: dib.details,
          },
          created_at: dib.created_at,
          updated_at: dib.updated_at || dib.created_at,
        };
      });
  }, [dibRecords]);

  // ── Combined map records: Enemy Sightings + Enemy Profile Locations + DIB Reports ──
  const allEnemyMapRecords: RecordItem[] = useMemo(() => {
    return [...enemyMapRecords, ...enemyProfileMapRecords, ...dibMapRecords];
  }, [enemyMapRecords, enemyProfileMapRecords, dibMapRecords]);

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMgrs(id);
    setTimeout(() => setCopiedMgrs(null), 2500);
  };

  // ── Filtered DIB Records ───────────────────────────────────────────────────
  const filteredDIBs = useMemo(() => {
    return dibRecords.filter((b) => {
      const matchSearch =
        !dibSearch ||
        (b.dib_id && b.dib_id.toLowerCase().includes(dibSearch.toLowerCase())) ||
        (b.activity && b.activity.toLowerCase().includes(dibSearch.toLowerCase())) ||
        (b.details && b.details.toLowerCase().includes(dibSearch.toLowerCase())) ||
        (b.threat_group && b.threat_group.toLowerCase().includes(dibSearch.toLowerCase())) ||
        (b.personality_victim && b.personality_victim.toLowerCase().includes(dibSearch.toLowerCase())) ||
        (b.motive && b.motive.toLowerCase().includes(dibSearch.toLowerCase())) ||
        (b.address && b.address.toLowerCase().includes(dibSearch.toLowerCase())) ||
        (b.mgrs && b.mgrs.toLowerCase().includes(dibSearch.toLowerCase())) ||
        (b.source_evaluation && b.source_evaluation.toLowerCase().includes(dibSearch.toLowerCase()));
      const matchType = dibTypeFilter === 'all' || b.type === dibTypeFilter;
      const matchThreat = dibThreatGroupFilter === 'all' || b.threat_group === dibThreatGroupFilter;
      const matchMotive = dibMotiveFilter === 'all' || b.motive === dibMotiveFilter;
      return matchSearch && matchType && matchThreat && matchMotive;
    });
  }, [dibRecords, dibSearch, dibTypeFilter, dibThreatGroupFilter, dibMotiveFilter]);

  // ── Filtered Enemy Locations ──────────────────────────────────────────────
  const filteredEnemyLocations = useMemo(() => {
    return enemyLocations.filter((loc) => {
      const matchSearch =
        !enemyLocSearch ||
        loc.hostile_element.toLowerCase().includes(enemyLocSearch.toLowerCase()) ||
        loc.group_affiliation.toLowerCase().includes(enemyLocSearch.toLowerCase()) ||
        loc.province_area.toLowerCase().includes(enemyLocSearch.toLowerCase()) ||
        loc.mgrs.toLowerCase().includes(enemyLocSearch.toLowerCase()) ||
        loc.activity.toLowerCase().includes(enemyLocSearch.toLowerCase());
      const matchThreat = enemyLocThreatFilter === 'all' || loc.threat_level === enemyLocThreatFilter;
      const matchStatus = enemyLocStatusFilter === 'all' || loc.status === enemyLocStatusFilter;
      return matchSearch && matchThreat && matchStatus;
    });
  }, [enemyLocations, enemyLocSearch, enemyLocThreatFilter, enemyLocStatusFilter]);

  // ── Filtered Enemy Profiles ───────────────────────────────────────────────
  const filteredProfiles = useMemo(() => {
    return enemyProfiles.filter((prof) => {
      const matchSearch =
        !profileSearch ||
        (prof.true_name && prof.true_name.toLowerCase().includes(profileSearch.toLowerCase())) ||
        (prof.alias && prof.alias.toLowerCase().includes(profileSearch.toLowerCase())) ||
        (prof.threat_group && prof.threat_group.toLowerCase().includes(profileSearch.toLowerCase())) ||
        (prof.threat_group_other && prof.threat_group_other.toLowerCase().includes(profileSearch.toLowerCase())) ||
        (prof.position_role && prof.position_role.toLowerCase().includes(profileSearch.toLowerCase())) ||
        (prof.address && prof.address.toLowerCase().includes(profileSearch.toLowerCase())) ||
        (prof.psr && prof.psr.toLowerCase().includes(profileSearch.toLowerCase())) ||
        (prof.latest_location_mgrs && prof.latest_location_mgrs.toLowerCase().includes(profileSearch.toLowerCase()));

      const matchThreat = profileThreatFilter === 'all' || prof.threat_group === profileThreatFilter;
      const matchValue = profileValueFilter === 'all' || prof.value === profileValueFilter;

      return matchSearch && matchThreat && matchValue;
    });
  }, [enemyProfiles, profileSearch, profileThreatFilter, profileValueFilter]);

  // Active DIB stats
  const violentDIBCount = useMemo(
    () => dibRecords.filter((d) => d.type === 'Violent').length,
    [dibRecords]
  );
  const nonViolentDIBCount = useMemo(
    () => dibRecords.filter((d) => d.type === 'Non-Violent').length,
    [dibRecords]
  );
  const uniqueThreatGroupsCount = useMemo(
    () => new Set(dibRecords.map((d) => d.threat_group)).size,
    [dibRecords]
  );
  const activeHostileCount = useMemo(
    () => enemyLocations.filter((e) => e.status === 'active_tracking').length,
    [enemyLocations]
  );
  const hviProfilesCount = useMemo(
    () => enemyProfiles.filter((p) => p.value === 'HVI').length,
    [enemyProfiles]
  );
  const nonHviProfilesCount = useMemo(
    () => enemyProfiles.filter((p) => p.value === 'Non-HVI').length,
    [enemyProfiles]
  );
  const uniqueProfileThreatGroups = useMemo(
    () => new Set(enemyProfiles.map((p) => p.threat_group)).size,
    [enemyProfiles]
  );

  return (
    <div className="space-y-6 font-sans">
      {/* ── 1. INTELLIGENCE CELL SUB-HEADER & HORIZONTAL TAB NAVIGATION ── */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden font-sans">
        {/* ── HORIZONTAL TAB NAVIGATION BAR (DIB, Latest Enemy Location, Enemy Profiling/Status) ── */}
        <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          {/* Tab 1: DIB */}
          <button
            onClick={() => setActiveTab('dib')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-sans transition-all shrink-0 ${
              activeTab === 'dib'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <FileText className={`w-4 h-4 ${activeTab === 'dib' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Daily Intelligence Brief (DIB)</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-sans border ${
                activeTab === 'dib'
                  ? 'bg-blue-100 text-blue-800 border-blue-200 font-bold'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {dibRecords.length}
            </span>
          </button>

          {/* Tab 2: Latest Enemy Location */}
          <button
            onClick={() => setActiveTab('enemy_location')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-sans transition-all shrink-0 ${
              activeTab === 'enemy_location'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Crosshair className={`w-4 h-4 ${activeTab === 'enemy_location' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Latest Enemy Location</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-sans border ${
                activeTab === 'enemy_location'
                  ? 'bg-blue-100 text-blue-800 border-blue-200 font-bold'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {enemyLocations.length}
            </span>
          </button>

          {/* Tab 3: Enemy Profiling/Status */}
          <button
            onClick={() => setActiveTab('enemy_profiling')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-sans transition-all shrink-0 ${
              activeTab === 'enemy_profiling'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Skull className={`w-4 h-4 ${activeTab === 'enemy_profiling' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Enemy Profiling / HVT Status</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-sans border ${
                activeTab === 'enemy_profiling'
                  ? 'bg-blue-100 text-blue-800 border-blue-200 font-bold'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {enemyProfiles.length}
            </span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 1: DIB (DAILY INTELLIGENCE BULLETIN) ────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'dib' && (
        <div className="space-y-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-sans text-slate-500 uppercase">Total DIB Records</div>
              <div className="text-2xl font-sans font-bold text-slate-900 mt-1">{dibRecords.length}</div>
              <div className="text-[11px] font-sans text-blue-600 mt-0.5">Automated Supabase Ingestion</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-sans text-slate-500 uppercase">Violent Incidents</div>
              <div className="text-2xl font-sans font-bold text-blue-700 mt-1">{violentDIBCount}</div>
              <div className="text-[11px] font-sans text-slate-800/80 mt-0.5">Clashes, Rido, Hostile Action</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-sans text-slate-500 uppercase">Non-Violent Reports</div>
              <div className="text-2xl font-sans font-bold text-blue-600 mt-1">{nonViolentDIBCount}</div>
              <div className="text-[11px] font-sans text-slate-700/80 mt-0.5">Movement, Intelligence Tips</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-sans text-slate-500 uppercase">Active Threat Groups</div>
              <div className="text-2xl font-sans font-bold text-blue-600 mt-1">{uniqueThreatGroupsCount}</div>
              <div className="text-[11px] font-sans text-slate-800/80 mt-0.5">BIFF, DIHG, PAGs, PIAGs...</div>
            </div>
          </div>

          {/* Action Bar & Filters */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search DIB ID, activity, threat group, personality, motive, address, MGRS..."
                  value={dibSearch}
                  onChange={(e) => setDibSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Type Filter */}
              <select
                value={dibTypeFilter}
                onChange={(e) => setDibTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">All Types</option>
                <option value="Violent">Violent</option>
                <option value="Non-Violent">Non-Violent</option>
              </select>

              {/* Threat Group Filter */}
              <select
                value={dibThreatGroupFilter}
                onChange={(e) => setDibThreatGroupFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">All Threat Groups</option>
                <option value="BIFF">BIFF</option>
                <option value="DIHG">DIHG</option>
                <option value="PAGs">PAGs</option>
                <option value="PIAGs">PIAGs</option>
                <option value="CRIMINALITY">CRIMINALITY</option>
                <option value="Armed Lawless Element">Armed Lawless Element</option>
                <option value="Others">Others</option>
              </select>

              {/* Motive Filter */}
              <select
                value={dibMotiveFilter}
                onChange={(e) => setDibMotiveFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">All Motives</option>
                <option value="Personal Grudge">Personal Grudge</option>
                <option value="Land Conflict">Land Conflict</option>
                <option value="Rido">Rido</option>
                <option value="Drug Related">Drug Related</option>
                <option value="Robbery">Robbery</option>
                <option value="Carnapping">Carnapping</option>
                <option value="Family Feud">Family Feud</option>
                <option value="Undetermined">Undetermined</option>
              </select>

              {/* View switch */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                <button
                  onClick={() => setDibViewMode('table')}
                  className={`p-1.5 rounded text-xs font-sans transition-colors ${
                    dibViewMode === 'table' ? 'bg-slate-100 text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Ledger Table View"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDibViewMode('cards')}
                  className={`p-1.5 rounded text-xs font-sans transition-colors ${
                    dibViewMode === 'cards' ? 'bg-slate-100 text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Briefing Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingDib(null);
                setIsDibModalOpen(true);
              }}
              className="flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold transition-all shadow-md active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Generate DIB</span>
            </button>
          </div>

          {/* DIB Content Listing */}
          {filteredDIBs.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-white border border-slate-200 border-dashed">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-sans font-bold text-slate-700 uppercase">No DIB Records Found</h4>
              <p className="text-xs font-sans text-slate-500 mt-1 max-w-md mx-auto">
                {dibSearch || dibTypeFilter !== 'all' || dibThreatGroupFilter !== 'all' || dibMotiveFilter !== 'all'
                  ? 'No DIB records match the active search or filter criteria.'
                  : 'No Daily Intelligence Bulletins recorded. Click "Generate DIB" to input activity, threat groups, motives, and auto-derive addresses.'}
              </p>
              <button
                onClick={() => {
                  setEditingDib(null);
                  setIsDibModalOpen(true);
                }}
                className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate First DIB</span>
              </button>
            </div>
          ) : dibViewMode === 'table' ? (
            /* Table View (Default) */
            <div className="rounded-xl bg-white border border-slate-200 shadow-md overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500">
                    <th className="py-2.5 px-3 whitespace-nowrap">DIB ID</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Date & Time</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Type</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Threat Group</th>
                    <th className="py-2.5 px-3 min-w-[220px]">Activity & Details</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Personality / Victim</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Motive</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Complete Address</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">10-Digit MGRS</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Source / Eval</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDIBs.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-100 transition-colors">
                      <td className="py-2.5 px-3 text-blue-600 font-bold whitespace-nowrap">{b.dib_id}</td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{b.datetime}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            b.type === 'Violent'
                              ? 'bg-rose-950 text-slate-800 border border-rose-800'
                              : 'bg-emerald-950 text-slate-700 border border-emerald-800'
                          }`}
                        >
                          {b.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 text-slate-800 border border-amber-800">
                          {b.threat_group}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 max-w-xs">
                        <p className="font-semibold text-slate-900" title={b.activity}>{b.activity}</p>
                        {b.details && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5" title={b.details}>
                            {b.details}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-semibold whitespace-nowrap">
                        {b.personality_victim || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
                          {b.motive}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[220px]" title={b.address}>{b.address}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-blue-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                            {b.mgrs}
                          </span>
                          <button
                            onClick={() => handleCopyText(b.mgrs, `tbl-mgrs-${b.id}`)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                            title="Copy MGRS"
                          >
                            {copiedMgrs === `tbl-mgrs-${b.id}` ? (
                              <Check className="w-3 h-3 text-blue-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {b.source_evaluation}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => setViewingDib(b)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] transition-colors"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setEditingDib(b);
                            setIsDibModalOpen(true);
                          }}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-blue-700 text-[10px] border border-cyan-800 transition-colors"
                          title="Edit DIB Record"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDIB(b.id)}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-slate-800 text-[10px] border border-rose-800 transition-colors"
                          title="Delete DIB Record"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDIBs.map((bulletin) => (
                <div
                  key={bulletin.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-500/50 shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold uppercase tracking-wider ${
                            bulletin.type === 'Violent'
                              ? 'bg-rose-950 text-slate-800 border border-rose-800'
                              : 'bg-emerald-950 text-slate-700 border border-emerald-800'
                          }`}
                        >
                          {bulletin.type}
                        </span>
                        <span className="text-[10px] font-sans font-bold text-blue-600">
                          {bulletin.dib_id}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-slate-800 border border-amber-800">
                          {bulletin.threat_group}
                        </span>
                        <span className="text-[10px] font-sans text-slate-500">{bulletin.datetime}</span>
                      </div>
                    </div>

                    {/* Activity & Details */}
                    <div className="mt-2.5 space-y-2">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Activity:</div>
                        <p className="text-xs font-sans text-slate-900 font-semibold mt-1 bg-slate-50/60 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                          {bulletin.activity}
                        </p>
                      </div>
                      {bulletin.details && (
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold">Details:</div>
                          <p className="text-xs font-sans text-slate-700 mt-1 bg-slate-50/40 p-2.5 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
                            {bulletin.details}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Details Box */}
                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] font-sans">
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="text-[9px] text-slate-500 uppercase">Personality / Victim</div>
                        <div className="text-slate-800 font-semibold truncate mt-0.5">
                          {bulletin.personality_victim || 'N/A'}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="text-[9px] text-slate-500 uppercase">Motive</div>
                        <div className="text-blue-600 font-semibold truncate mt-0.5">{bulletin.motive}</div>
                      </div>
                    </div>

                    {/* Address & MGRS */}
                    <div className="mt-2.5 space-y-1.5 text-xs font-sans">
                      <div className="flex items-center space-x-1 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{bulletin.address}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                        <span className="text-blue-600 font-bold text-[11px]">MGRS: {bulletin.mgrs}</span>
                        <span className="text-slate-500 text-[10px]">Source: {bulletin.source_evaluation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-sans">
                    <button
                      onClick={() => setViewingDib(bulletin)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors text-[11px]"
                    >
                      View Details
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => {
                          const formatted = `=== DAILY INTELLIGENCE BULLETIN ===\nDIB ID: ${bulletin.dib_id}\nDATE & TIME: ${bulletin.datetime}\nTYPE: ${bulletin.type}\nTHREAT GROUP: ${bulletin.threat_group}\nACTIVITY: ${bulletin.activity}\nDETAILS: ${bulletin.details || 'N/A'}\nPERSONALITY / VICTIM: ${bulletin.personality_victim}\nMOTIVE: ${bulletin.motive}\nADDRESS: ${bulletin.address}\nMGRS: ${bulletin.mgrs}\nSOURCE/EVALUATION: ${bulletin.source_evaluation}`;
                          handleCopyText(formatted, `card-dib-${bulletin.id}`);
                        }}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors"
                        title="Copy DIB Text"
                      >
                        {copiedMgrs === `card-dib-${bulletin.id}` ? (
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingDib(bulletin);
                          setIsDibModalOpen(true);
                        }}
                        className="flex items-center space-x-1 px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-blue-700 border border-cyan-800 text-[11px] transition-colors"
                        title="Edit Record"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDIB(bulletin.id)}
                        className="flex items-center space-x-1 px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-slate-800 border border-rose-800 text-[11px] transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
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
      {/* ── TAB 2: LATEST ENEMY LOCATION (GIS & MGRS TRACKING) ──────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'enemy_location' && (
        <div className="space-y-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-sans text-slate-500 uppercase">Tracked Enemy Locations</div>
              <div className="text-2xl font-sans font-bold text-blue-700 mt-1">{enemyLocations.length}</div>
              <div className="text-[11px] font-sans text-slate-800/80 mt-0.5">Active Hostile Beacons</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-sans text-slate-500 uppercase">Active Tracking Status</div>
              <div className="text-2xl font-sans font-bold text-blue-600 mt-1">{activeHostileCount}</div>
              <div className="text-[11px] font-sans text-slate-700/80 mt-0.5">Live Sensor Grid Lock</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-sans text-slate-500 uppercase">Critical Threat Elements</div>
              <div className="text-2xl font-sans font-bold text-blue-600 mt-1">
                {enemyLocations.filter((e) => e.threat_level === 'critical').length}
              </div>
              <div className="text-[11px] font-sans text-slate-800/80 mt-0.5">Immediate Ambush / Clash Risk</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-sans text-slate-500 uppercase">Tactical MGRS Precision</div>
              <div className="text-sm font-sans font-bold text-blue-600 mt-2 flex items-center space-x-1.5">
                <Crosshair className="w-4 h-4 text-blue-600" />
                <span>10-DIGIT GRID VALIDATED</span>
              </div>
              <div className="text-[11px] font-sans text-slate-500 mt-0.5">Auto-Converted to Lat/Lng</div>
            </div>
          </div>

          {/* Action Bar & Filters */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search hostile unit, MGRS grid, province, activity..."
                  value={enemyLocSearch}
                  onChange={(e) => setEnemyLocSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Threat Filter */}
              <select
                value={enemyLocThreatFilter}
                onChange={(e) => setEnemyLocThreatFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">All Threat Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Status Filter */}
              <select
                value={enemyLocStatusFilter}
                onChange={(e) => setEnemyLocStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">All Tracking Statuses</option>
                <option value="active_tracking">Active Tracking</option>
                <option value="lost_contact">Lost Contact</option>
                <option value="engaged">Troops in Contact</option>
                <option value="neutralized">Neutralized</option>
                <option value="cleared">Cleared</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingEnemyLoc(null);
                setIsEnemyLocModalOpen(true);
              }}
              className="flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold transition-all shadow-md active:scale-95 shrink-0"
            >
              <Crosshair className="w-4 h-4" />
              <span>Log Enemy Sighting</span>
            </button>
          </div>

          {/* Map + Enemy Profiles Side-by-Side Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            {/* Tactical Map (4/5 = 80%) */}
            <div className="xl:col-span-4 space-y-2">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <Crosshair className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-sans font-bold text-slate-900 uppercase tracking-wider">
                    Hostile GIS Tactical Grid (Enemy MGRS Plot)
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-rose-950 text-slate-800 border border-rose-800">
                    {enemyMapRecords.length} SIGHTINGS
                  </span>
                  {enemyProfileMapRecords.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-rose-950 text-slate-800 border border-rose-800">
                      {enemyProfileMapRecords.length} HVT PROFILES
                    </span>
                  )}
                  {dibMapRecords.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-slate-50 text-slate-800 border border-rose-700/60">
                      {dibMapRecords.length} DIB REPORTS
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-sans text-slate-500">
                  Click markers to inspect hostile coordinates
                </span>
              </div>
              {/* Map legend */}
              <div className="px-3 py-2 bg-slate-50/60 border-x border-slate-200 flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <div className="animate-red-beacon absolute w-3.5 h-3.5 rounded-full bg-rose-500/45 border border-rose-500"></div>
                    <div className="relative z-10 w-2 h-2 rounded-full bg-rose-500 border border-white shadow-[0_0_6px_#ef4444]"></div>
                  </div>
                  <span className="text-[10px] font-sans font-medium text-slate-800">Hostile Sighting / Enemy Contact (Flashing Red Dot)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <div className="animate-red-beacon absolute w-3.5 h-3.5 rounded-full bg-red-600/45 border border-red-600"></div>
                    <div className="relative z-10 w-2 h-2 rounded-full bg-red-700 border border-yellow-200 shadow-[0_0_6px_#dc2626]"></div>
                  </div>
                  <span className="text-[10px] font-sans font-medium text-red-300">HVT Enemy Profile (Gold Border Red Dot)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-500/25 border border-rose-500/70 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-rose-600 border border-white shadow-[0_0_4px_#ef4444]"></div>
                    </div>
                  </div>
                  <span className="text-[10px] font-sans font-medium text-slate-800">DIB Bulletin Report (Non-Flashing Red Dot)</span>
                </div>
              </div>
              <div className="rounded-b-xl overflow-hidden border border-slate-200 shadow-md">
                <TacticalMap
                  records={allEnemyMapRecords}
                  focusedRecordId={mapFocusedId}
                  onSelectRecord={(rec) => {
                    setMapFocusedId(rec.id);
                    if (rec.id.startsWith('dib-')) {
                      const rawId = rec.id.replace('dib-', '');
                      setSelectedDibId(rawId);
                      setSidePanelTab('dib');
                    } else if (rec.id.startsWith('prof-')) {
                      setSidePanelTab('hvt');
                    } else {
                      const match = enemyLocations.find((l) => l.id === rec.id);
                      if (match) setSelectedEnemyLoc(match);
                    }
                  }}
                  isLive={true}
                  onRefresh={loadIntelDataFromSupabase}
                  className="h-[480px] w-full"
                />
              </div>
            </div>

            {/* Side Intel Details Panel (1/5 = 20%) — beside the map */}
            <div className="xl:col-span-1 flex flex-col">
              {/* Switcher Tab Header */}
              <div className="p-2 bg-slate-50/90 border border-rose-800/50 rounded-t-xl flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSidePanelTab('hvt')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-sans font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                    sidePanelTab === 'hvt'
                      ? 'bg-rose-950 text-rose-200 border border-rose-700/80 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-red-600 border border-yellow-200 shrink-0"></div>
                  <span className="truncate">HVT ({enemyProfileMapRecords.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSidePanelTab('dib')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-sans font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                    sidePanelTab === 'dib'
                      ? 'bg-rose-950 text-rose-200 border border-rose-700/80 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-rose-500 border border-white shrink-0"></div>
                  <span className="truncate">DIB ({dibMapRecords.length})</span>
                </button>
              </div>

              {/* Scrollable list — height matches tactical map (h-[480px]) */}
              <div className="overflow-y-auto rounded-b-xl border border-rose-800/40 border-t-0 bg-white/80 divide-y divide-slate-200" style={{ height: '480px' }}>
                {sidePanelTab === 'hvt' ? (
                  enemyProfileMapRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                      <MapPin className="w-8 h-8 text-slate-600 mb-2" />
                      <p className="text-xs font-sans text-slate-500">No enemy profiles with MGRS location data found in Supabase <code className="text-blue-700">enemy_profiles</code> table.</p>
                    </div>
                  ) : (
                    enemyProfileMapRecords.map((rec) => {
                      const prof = enemyProfiles.find((p) => `prof-${p.id}` === rec.id);
                      const isHVI = rec.metadata?.value === 'HVI';
                      const isSelected = mapFocusedId === rec.id;
                      return (
                        <div
                          key={rec.id}
                          className={`p-3 transition-colors cursor-pointer ${
                            isSelected ? 'bg-rose-950/40 border-l-2 border-rose-500' : 'hover:bg-rose-950/15'
                          }`}
                          onClick={() => setMapFocusedId(rec.id)}
                        >
                          {/* Name row */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="relative w-3.5 h-3.5 flex items-center justify-center shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-600 border border-yellow-200 shadow-[0_0_4px_#dc2626]"></div>
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-sans font-bold text-red-300 truncate">
                                  {prof?.true_name || rec.title}
                                </div>
                                {prof?.alias && (
                                  <div className="text-[10px] font-sans text-slate-500 truncate">
                                    &quot;{prof.alias}&quot;
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  isHVI
                                    ? 'bg-rose-950 text-slate-800 border border-rose-800'
                                    : 'bg-slate-50 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {rec.metadata?.value || 'HVI'}
                              </span>
                            </div>
                          </div>

                          {/* Threat group + role */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-slate-800 border border-amber-800">
                              {rec.metadata?.threat_group || '—'}
                            </span>
                            {prof?.position_role && (
                              <span className="text-[10px] font-sans text-slate-500 truncate">{prof.position_role}</span>
                            )}
                          </div>

                          {/* MGRS + copy */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-sans truncate">
                                {rec.metadata?.mgrs || '—'}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyText(rec.metadata?.mgrs || '', `side-mgrs-${rec.id}`);
                                }}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 shrink-0"
                                title="Copy MGRS"
                              >
                                {copiedMgrs === `side-mgrs-${rec.id}` ? (
                                  <Check className="w-3 h-3 text-blue-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            {rec.metadata?.psr && (
                              <span className="text-[9px] font-sans text-blue-600 shrink-0">{rec.metadata.psr}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  dibMapRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                      <FileText className="w-8 h-8 text-slate-600 mb-2" />
                      <p className="text-xs font-sans text-slate-500">No DIB reports with MGRS coordinates found in Supabase <code className="text-blue-700">intel_dib</code> table.</p>
                    </div>
                  ) : (
                    dibMapRecords.map((rec) => {
                      const rawId = rec.id.replace('dib-', '');
                      const dib = dibRecords.find((d) => d.id === rawId || d.id === rec.id);
                      const isSelected = mapFocusedId === rec.id || selectedDibId === rawId;
                      return (
                        <div
                          key={rec.id}
                          className={`p-3 transition-colors cursor-pointer space-y-2 ${
                            isSelected ? 'bg-rose-950/40 border-l-2 border-rose-500' : 'hover:bg-rose-950/15'
                          }`}
                          onClick={() => {
                            setMapFocusedId(rec.id);
                            setSelectedDibId(rawId);
                          }}
                        >
                          {/* Header row: DIB ID + Type */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white shadow-[0_0_4px_#ef4444] shrink-0"></div>
                              <span className="text-xs font-sans font-bold text-slate-800 truncate">
                                {dib?.dib_id || rec.code}
                              </span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold uppercase bg-slate-50 text-slate-700 border border-slate-200 shrink-0">
                              {dib?.type || 'Intel'}
                            </span>
                          </div>

                          {/* Activity / Title */}
                          <div className="text-xs font-sans font-semibold text-slate-800 line-clamp-2 leading-tight">
                            {dib?.activity || rec.title}
                          </div>

                          {/* Threat Group & Motive */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-slate-800 border border-amber-800">
                              {dib?.threat_group || rec.metadata?.threat_group || '—'}
                            </span>
                            {dib?.motive && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-sans text-blue-700 bg-blue-50 border border-blue-200 truncate">
                                {dib.motive}
                              </span>
                            )}
                          </div>

                          {/* Target / Victim Info */}
                          {dib?.personality_victim && dib.personality_victim !== 'N/A' && (
                            <div className="text-[10px] font-sans text-slate-500 truncate">
                              <span className="text-slate-500 font-bold">TARGET:</span> {dib.personality_victim}
                            </div>
                          )}

                          {/* MGRS + DTG */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-sans truncate">
                                {rec.metadata?.mgrs || dib?.mgrs || '—'}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyText(rec.metadata?.mgrs || dib?.mgrs || '', `side-dib-${rec.id}`);
                                }}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 shrink-0"
                                title="Copy MGRS"
                              >
                                {copiedMgrs === `side-dib-${rec.id}` ? (
                                  <Check className="w-3 h-3 text-blue-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            {dib?.datetime && (
                              <span className="text-[9px] font-sans text-slate-500 shrink-0 truncate max-w-[90px]">
                                {dib.datetime}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 3: ENEMY PROFILING/STATUS (ORBAT & THREAT DOSSIERS) ─────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'enemy_profiling' && (
        <div className="space-y-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-sans text-slate-500 uppercase">Profiled Hostile Targets</div>
              <div className="text-2xl font-sans font-bold text-blue-600 mt-1">{enemyProfiles.length}</div>
              <div className="text-[11px] font-sans text-slate-700/80 mt-0.5">Cataloged Target Profiles</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-sans text-slate-500 uppercase">High-Value Individuals (HVI)</div>
              <div className="text-2xl font-sans font-bold text-blue-700 mt-1">{hviProfilesCount}</div>
              <div className="text-[11px] font-sans text-slate-800/80 mt-0.5">Priority High-Value Targets</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-sans text-slate-500 uppercase">Non-HVI Elements</div>
              <div className="text-2xl font-sans font-bold text-blue-600 mt-1">{nonHviProfilesCount}</div>
              <div className="text-[11px] font-sans text-blue-700/80 mt-0.5">Active Monitored Personnel</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-sans text-slate-500 uppercase">Threat Groups Represented</div>
              <div className="text-2xl font-sans font-bold text-blue-600 mt-1">{uniqueProfileThreatGroups}</div>
              <div className="text-[11px] font-sans text-slate-800/80 mt-0.5">Active Factions in AOR</div>
            </div>
          </div>

          {/* Supabase Schema Notice Banner if table is not yet created */}
          {supabaseTableNotice && (
            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans">
              <div className="flex items-start space-x-2 text-amber-200">
                <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Supabase Notice: </span>
                  <span>{supabaseTableNotice}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const sql = `-- Execute in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.enemy_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    true_name TEXT NOT NULL,
    alias TEXT DEFAULT '',
    threat_group TEXT NOT NULL DEFAULT 'BIFF',
    threat_group_other TEXT DEFAULT '',
    position_role TEXT DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    province TEXT DEFAULT '',
    municipality TEXT DEFAULT '',
    barangay TEXT DEFAULT '',
    purok_sitio TEXT DEFAULT '',
    picture_url TEXT DEFAULT '',
    value TEXT NOT NULL DEFAULT 'HVI',
    psr TEXT DEFAULT '',
    latest_location_mgrs TEXT DEFAULT '',
    lat DOUBLE PRECISION DEFAULT 7.2236,
    lng DOUBLE PRECISION DEFAULT 124.2464,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enemy_profiles_true_name ON public.enemy_profiles(true_name);
CREATE INDEX IF NOT EXISTS idx_enemy_profiles_threat_group ON public.enemy_profiles(threat_group);
CREATE INDEX IF NOT EXISTS idx_enemy_profiles_value ON public.enemy_profiles(value);
CREATE INDEX IF NOT EXISTS idx_enemy_profiles_mgrs ON public.enemy_profiles(latest_location_mgrs);
ALTER TABLE public.enemy_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on enemy_profiles" ON public.enemy_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.enemy_profiles; END IF; EXCEPTION WHEN duplicate_object THEN null; END $$;
NOTIFY pgrst, 'reload schema';`;
                  navigator.clipboard.writeText(sql);
                  alert('Supabase SQL setup script copied to clipboard!\n\nPaste and click "Run" in your Supabase Dashboard > SQL Editor.');
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-700 text-xs font-bold transition-all shrink-0 shadow-sm"
              >
                Copy Supabase SQL
              </button>
            </div>
          )}

          {/* Action Bar & Filters */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search True Name, Alias, Threat Group, Role, Address, PSR, MGRS..."
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Refresh from Supabase Button */}
              <button
                onClick={loadIntelDataFromSupabase}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-500 text-slate-500 hover:text-slate-700 transition-colors"
                title="Sync & Fetch from Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              {/* Threat Group Filter */}
              <select
                value={profileThreatFilter}
                onChange={(e) => setProfileThreatFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">All Threat Groups</option>
                {THREAT_GROUPS.map((tg) => (
                  <option key={tg} value={tg}>
                    {tg}
                  </option>
                ))}
              </select>

              {/* Value Filter (HVI / Non-HVI) */}
              <select
                value={profileValueFilter}
                onChange={(e) => setProfileValueFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">All Values (HVI & Non-HVI)</option>
                <option value="HVI">HVI (High-Value Individual)</option>
                <option value="Non-HVI">Non-HVI</option>
              </select>

              {/* View switch */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                <button
                  onClick={() => setProfileViewMode('table')}
                  className={`p-1.5 rounded text-xs font-sans transition-colors ${
                    profileViewMode === 'table'
                      ? 'bg-slate-100 text-blue-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Table View"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setProfileViewMode('cards')}
                  className={`p-1.5 rounded text-xs font-sans transition-colors ${
                    profileViewMode === 'cards'
                      ? 'bg-slate-100 text-blue-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingEnemyProfile(null);
                setIsEnemyProfileModalOpen(true);
              }}
              className="flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold transition-all shadow-md active:scale-95 shrink-0"
            >
              <Skull className="w-4 h-4" />
              <span>Create Enemy Profile</span>
            </button>
          </div>

          {/* Profiling Listing: Table View (Always renders the table structure when in table mode) */}
          {profileViewMode === 'table' ? (
            <div className="rounded-xl bg-white border border-slate-200 shadow-md overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500">
                    <th className="py-3 px-3.5 w-14 text-center">Photo</th>
                    <th className="py-3 px-3.5">True Name & Alias</th>
                    <th className="py-3 px-3.5">Threat Group</th>
                    <th className="py-3 px-3.5">Position / Role</th>
                    <th className="py-3 px-3.5">Address</th>
                    <th className="py-3 px-3.5 text-center">Value</th>
                    <th className="py-3 px-3.5">PSR</th>
                    <th className="py-3 px-3.5">Latest Location (MGRS)</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                        <Skull className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <div className="text-sm font-bold text-slate-700 uppercase">No Enemy Profiles Found</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {profileSearch || profileThreatFilter !== 'all' || profileValueFilter !== 'all'
                            ? 'No hostile profiles match the active search or filters.'
                            : 'Database currently has no profiles recorded. Click "Create Enemy Profile" to catalog targets.'}
                        </div>
                        <button
                          onClick={() => {
                            setEditingEnemyProfile(null);
                            setIsEnemyProfileModalOpen(true);
                          }}
                          className="mt-3.5 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Enemy Profile</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p) => {
                      const isHvi = p.value === 'HVI';
                      return (
                        <tr key={p.id} className="hover:bg-slate-100 transition-colors">
                          {/* Photo Thumbnail */}
                          <td className="py-2.5 px-3.5 text-center">
                            <div
                              onClick={() => setViewingEnemyProfile(p)}
                              className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto cursor-pointer hover:border-purple-500 transition-colors shrink-0 shadow-sm"
                              title="Click to view dossier"
                            >
                              {p.picture_url ? (
                                <img
                                  src={p.picture_url}
                                  alt={p.true_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Skull className="w-5 h-5 text-slate-600" />
                              )}
                            </div>
                          </td>

                          {/* True Name & Alias */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <div
                              onClick={() => setViewingEnemyProfile(p)}
                              className="text-slate-900 font-bold hover:text-slate-700 cursor-pointer flex items-center space-x-1.5 transition-colors"
                            >
                              <span>{p.true_name}</span>
                            </div>
                            {p.alias ? (
                              <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                                &ldquo;{p.alias}&rdquo;
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-500 mt-0.5">No alias</div>
                            )}
                          </td>

                          {/* Threat Group */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-slate-800 border border-amber-800">
                              {p.threat_group === 'Others' && p.threat_group_other
                                ? p.threat_group_other
                                : p.threat_group}
                            </span>
                          </td>

                          {/* Position / Role */}
                          <td className="py-2.5 px-3.5 text-slate-700 whitespace-nowrap font-medium">
                            {p.position_role || <span className="text-slate-600">—</span>}
                          </td>

                          {/* Address */}
                          <td className="py-2.5 px-3.5 text-slate-700 max-w-[220px]">
                            <div className="flex items-center space-x-1 text-slate-700 truncate" title={p.address}>
                              <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                              <span className="truncate">{p.address || '—'}</span>
                            </div>
                          </td>

                          {/* Value Dropdown (HVI / Non-HVI) */}
                          <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isHvi
                                  ? 'bg-rose-950 text-slate-800 border border-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                                  : 'bg-slate-900 text-slate-700 border border-slate-700'
                              }`}
                            >
                              {p.value}
                            </span>
                          </td>

                          {/* PSR */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-800 font-semibold font-sans">
                            {p.psr || <span className="text-slate-600">—</span>}
                          </td>

                          {/* Latest Location (MGRS) */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            {p.latest_location_mgrs ? (
                              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-blue-600 font-sans text-[11px]">
                                <span>{p.latest_location_mgrs}</span>
                                <button
                                  onClick={() => handleCopyText(p.latest_location_mgrs || '', `prof-mgrs-${p.id}`)}
                                  className="p-0.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                                  title="Copy MGRS"
                                >
                                  {copiedMgrs === `prof-mgrs-${p.id}` ? (
                                    <Check className="w-3 h-3 text-blue-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Actions: Right corner Edit and Delete buttons */}
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => {
                                  setEditingEnemyProfile(p);
                                  setIsEnemyProfileModalOpen(true);
                                }}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-cyan-950 text-blue-700 hover:text-cyan-200 border border-cyan-800/60 hover:border-cyan-500 transition-colors shadow-sm font-semibold text-xs"
                                title="Edit Profile"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteEnemyProfile(p.id, p.true_name)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-rose-950 text-slate-800 hover:text-rose-200 border border-rose-800/60 hover:border-rose-500 transition-colors shadow-sm font-semibold text-xs"
                                title="Delete Profile"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
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
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProfiles.map((prof) => {
                const isHvi = prof.value === 'HVI';
                return (
                  <div
                    key={prof.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-500/50 shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold uppercase ${
                            isHvi
                              ? 'bg-rose-950 text-slate-800 border border-rose-800 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                              : 'bg-slate-900 text-slate-700 border border-slate-700'
                          }`}
                        >
                          {prof.value}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[9px] font-sans font-bold bg-amber-950/80 text-slate-800 border border-amber-800">
                          {prof.threat_group === 'Others' && prof.threat_group_other
                            ? prof.threat_group_other
                            : prof.threat_group}
                        </span>
                      </div>

                      {/* Header with Photo & Name */}
                      <div className="mt-3 flex items-start space-x-3">
                        <div
                          onClick={() => setViewingEnemyProfile(prof)}
                          className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors shrink-0"
                        >
                          {prof.picture_url ? (
                            <img
                              src={prof.picture_url}
                              alt={prof.true_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Skull className="w-6 h-6 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            onClick={() => setViewingEnemyProfile(prof)}
                            className="text-sm font-sans font-bold text-slate-900 hover:text-slate-700 cursor-pointer transition-colors truncate"
                          >
                            {prof.true_name}
                          </h3>
                          {prof.alias && (
                            <div className="text-[11px] font-sans text-blue-600 font-semibold mt-0.5 truncate">
                              Alias: &ldquo;{prof.alias}&rdquo;
                            </div>
                          )}
                          {prof.position_role && (
                            <div className="text-[10px] font-sans text-slate-500 mt-0.5 truncate">
                              Role: {prof.position_role}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info Panel: Address, PSR, Location */}
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs font-sans">
                        <div className="flex items-start space-x-1 text-slate-700 text-[11px]">
                          <MapPin className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{prof.address || 'Address not specified'}</span>
                        </div>
                        {prof.psr && (
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase">PSR:</span>{' '}
                            <span className="text-blue-600 font-semibold">{prof.psr}</span>
                          </div>
                        )}
                        {prof.latest_location_mgrs && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 uppercase">Latest MGRS:</span>
                            <span className="text-slate-800 font-sans text-[11px] font-semibold">
                              {prof.latest_location_mgrs}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Footer with Edit & Delete */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-sans">
                      <button
                        onClick={() => setViewingEnemyProfile(prof)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors text-[11px]"
                        title="Open Full Dossier"
                      >
                        Dossier
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            setEditingEnemyProfile(prof);
                            setIsEnemyProfileModalOpen(true);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-cyan-950 text-blue-700 hover:text-cyan-200 border border-cyan-800/60 hover:border-cyan-500 transition-colors text-[11px] font-semibold"
                          title="Edit Profile"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteEnemyProfile(prof.id, prof.true_name)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-rose-950 text-slate-800 hover:text-rose-200 border border-rose-800/60 hover:border-rose-500 transition-colors text-[11px] font-semibold"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
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
      {/* ── MODALS: VIEW DIB BRIEFING DETAILS ────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {viewingDib && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-cyan-600/50 rounded-xl max-w-2xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-sans font-bold text-slate-900 uppercase">
                  Daily Intelligence Bulletin // {viewingDib.dib_id}
                </span>
              </div>
              <button
                onClick={() => setViewingDib(null)}
                className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto font-sans text-xs text-slate-700">
              {/* Badges & Timestamp Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      viewingDib.type === 'Violent'
                        ? 'bg-rose-950 text-slate-800 border border-rose-800'
                        : 'bg-emerald-950 text-slate-700 border border-emerald-800'
                    }`}
                  >
                    {viewingDib.type}
                  </span>
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-950 text-slate-800 border border-amber-800">
                    {viewingDib.threat_group === 'Others' && viewingDib.threat_group_other
                      ? viewingDib.threat_group_other
                      : viewingDib.threat_group}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>DTG: {viewingDib.datetime}</span>
                </div>
              </div>

              {/* Activity & Details Section */}
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-blue-600 uppercase font-bold tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Reported Incident / Activity</span>
                  </div>
                  <p className="text-slate-900 text-sm font-semibold leading-relaxed whitespace-pre-wrap">{viewingDib.activity}</p>
                </div>

                {viewingDib.details && (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Operational Details / Specifics</span>
                    </div>
                    <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap">{viewingDib.details}</p>
                  </div>
                )}
              </div>

              {/* Personality Involved & Motive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Personality Involved or Victim</div>
                  <div className="text-sm font-bold text-slate-900">{viewingDib.personality_victim || 'N/A'}</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Assessed Motive</div>
                  <div className="text-sm font-bold text-blue-600">{viewingDib.motive}</div>
                </div>
              </div>

              {/* Complete Address */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Incident Location & Derived Address</span>
                </div>
                <div className="text-slate-900 font-semibold text-xs pl-5">{viewingDib.address}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 pl-5 text-[11px] text-slate-500">
                  <div>Province: <span className="text-slate-800">{viewingDib.province || 'N/A'}</span></div>
                  <div>Municipality: <span className="text-slate-800">{viewingDib.municipality || 'N/A'}</span></div>
                  <div>Barangay: <span className="text-slate-800">{viewingDib.barangay || 'N/A'}</span></div>
                  <div>Purok/Sitio: <span className="text-slate-800">{viewingDib.purok_sitio || 'N/A'}</span></div>
                </div>
              </div>

              {/* 10-Digit MGRS Grid Coordinate & Source Evaluation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">10-Digit MGRS Grid</div>
                    <div className="text-sm font-bold text-blue-600 mt-0.5">{viewingDib.mgrs}</div>
                  </div>
                  <button
                    onClick={() => handleCopyText(viewingDib.mgrs, `view-mgrs-${viewingDib.id}`)}
                    className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                    title="Copy MGRS"
                  >
                    {copiedMgrs === `view-mgrs-${viewingDib.id}` ? (
                      <Check className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Source / Evaluation</div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">{viewingDib.source_evaluation}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  const formatted = `=== DAILY INTELLIGENCE BULLETIN ===\nDIB ID: ${viewingDib.dib_id}\nDATE & TIME: ${viewingDib.datetime}\nTYPE: ${viewingDib.type}\nTHREAT GROUP: ${viewingDib.threat_group}\nACTIVITY: ${viewingDib.activity}\nDETAILS: ${viewingDib.details || 'N/A'}\nPERSONALITY / VICTIM: ${viewingDib.personality_victim}\nMOTIVE: ${viewingDib.motive}\nADDRESS: ${viewingDib.address}\nMGRS: ${viewingDib.mgrs}\nSOURCE/EVALUATION: ${viewingDib.source_evaluation}`;
                  handleCopyText(formatted, `view-dib-${viewingDib.id}`);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-sans border border-slate-200 transition-colors"
              >
                {copiedMgrs === `view-dib-${viewingDib.id}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-blue-600 font-bold">Copied Full Text</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Record</span>
                  </>
                )}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingDib(viewingDib);
                    setIsDibModalOpen(true);
                    setViewingDib(null);
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-blue-700 border border-cyan-800 text-xs font-sans font-bold transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Record</span>
                </button>

                <button
                  onClick={() => setViewingDib(null)}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── MODALS: VIEW HOSTILE PROFILE DOSSIER ─────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {viewingEnemyProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-purple-600/50 rounded-xl max-w-2xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skull className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-sans font-bold text-slate-900 uppercase">
                  Classified Enemy Profile // {viewingEnemyProfile.true_name}
                </span>
              </div>
              <button
                onClick={() => setViewingEnemyProfile(null)}
                className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto font-sans text-xs text-slate-700">
              {/* Header with Photo, True Name, Alias, and Value Badge */}
              <div className="flex flex-col sm:flex-row items-start gap-4 pb-4 border-b border-slate-200">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-50 border-2 border-slate-200 flex items-center justify-center shrink-0 shadow-lg">
                  {viewingEnemyProfile.picture_url ? (
                    <img
                      src={viewingEnemyProfile.picture_url}
                      alt={viewingEnemyProfile.true_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Skull className="w-10 h-10 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        viewingEnemyProfile.value === 'HVI'
                          ? 'bg-rose-950 text-slate-800 border border-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                          : 'bg-slate-900 text-slate-700 border border-slate-700'
                      }`}
                    >
                      {viewingEnemyProfile.value}
                    </span>
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-950 text-slate-800 border border-amber-800">
                      {viewingEnemyProfile.threat_group === 'Others' && viewingEnemyProfile.threat_group_other
                        ? viewingEnemyProfile.threat_group_other
                        : viewingEnemyProfile.threat_group}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{viewingEnemyProfile.true_name}</h3>
                    {viewingEnemyProfile.alias && (
                      <div className="text-blue-600 font-semibold text-xs mt-0.5">
                        Alias: &ldquo;{viewingEnemyProfile.alias}&rdquo;
                      </div>
                    )}
                    {viewingEnemyProfile.position_role && (
                      <div className="text-slate-500 text-xs mt-0.5">
                        Role: {viewingEnemyProfile.position_role}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid: PSR & Latest Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">PSR</div>
                  <div className="text-sm font-bold text-blue-600 font-sans">
                    {viewingEnemyProfile.psr || 'None Specified'}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Latest Location (MGRS)</div>
                    <div className="text-sm font-bold text-blue-600 font-sans mt-0.5">
                      {viewingEnemyProfile.latest_location_mgrs || 'No MGRS Logged'}
                    </div>
                  </div>
                  {viewingEnemyProfile.latest_location_mgrs && (
                    <button
                      onClick={() => handleCopyText(viewingEnemyProfile.latest_location_mgrs || '', `view-mgrs-${viewingEnemyProfile.id}`)}
                      className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                      title="Copy MGRS"
                    >
                      {copiedMgrs === `view-mgrs-${viewingEnemyProfile.id}` ? (
                        <Check className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Complete Address Breakdown */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Recorded Address & Operating Area</span>
                </div>
                <div className="text-slate-900 font-semibold text-xs pl-5">
                  {viewingEnemyProfile.address || 'Theater AOR'}
                </div>
                {(viewingEnemyProfile.province || viewingEnemyProfile.municipality || viewingEnemyProfile.barangay || viewingEnemyProfile.purok_sitio) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 pl-5 text-[11px] text-slate-500">
                    <div>Province: <span className="text-slate-800">{viewingEnemyProfile.province || '—'}</span></div>
                    <div>Municipality: <span className="text-slate-800">{viewingEnemyProfile.municipality || '—'}</span></div>
                    <div>Barangay: <span className="text-slate-800">{viewingEnemyProfile.barangay || '—'}</span></div>
                    <div>Purok/Sitio: <span className="text-slate-800">{viewingEnemyProfile.purok_sitio || '—'}</span></div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setEditingEnemyProfile(viewingEnemyProfile);
                  setIsEnemyProfileModalOpen(true);
                  setViewingEnemyProfile(null);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-200 text-xs font-sans font-bold transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>

              <button
                onClick={() => setViewingEnemyProfile(null)}
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── CREATE / EDIT MODALS ─────────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <DIBModal
        isOpen={isDibModalOpen}
        onClose={() => {
          setIsDibModalOpen(false);
          setEditingDib(null);
        }}
        onSave={handleSaveDIB}
        initialData={editingDib}
        dutyOfficer={dutyOfficer}
        callsign={callsign}
      />

      <EnemyLocationModal
        isOpen={isEnemyLocModalOpen}
        onClose={() => {
          setIsEnemyLocModalOpen(false);
          setEditingEnemyLoc(null);
        }}
        onSave={handleSaveEnemyLocation}
        initialData={editingEnemyLoc}
        dutyOfficer={dutyOfficer}
      />

      <EnemyProfileModal
        isOpen={isEnemyProfileModalOpen}
        onClose={() => {
          setIsEnemyProfileModalOpen(false);
          setEditingEnemyProfile(null);
        }}
        onSave={handleSaveEnemyProfile}
        initialData={editingEnemyProfile}
      />
    </div>
  );
}

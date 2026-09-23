'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RecordItem, RecordCategory, RecordStatus } from '@/types';
import ForceUnitModal, { ForceUnit } from './ForceUnitModal';
import UnitTaskingModal, { UnitTasking } from './UnitTaskingModal';
import MovementModal, { MovementDeployment } from './MovementModal';
import SpotReportModal, { SpotReport } from './SpotReportModal';
import DirectiveModal, { OperationalDirective } from './DirectiveModal';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { toMGRS, resolveCoordinates, toZuluDTG, parseMGRSToCoords, PRESET_AREA_COORDS } from '@/lib/mgrsUtils';
import {
  Map,
  Activity,
  AlertTriangle,
  Users,
  Target,
  CheckSquare,
  Layers,
  Truck,
  Plane,
  Anchor,
  Navigation,
  Clock,
  FileText,
  FileWarning,
  Paperclip,
  Download,
  Send,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Check,
  Shield,
  ShieldAlert,
  MapPin,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Printer,
  Calendar,
  Radio,
  Compass,
  ArrowUpRight,
  TrendingUp,
  Edit,
  Trash2,
  Table,
  LayoutGrid,
  Database,
  X,
  Crosshair,
} from 'lucide-react';
import TacticalMap from './TacticalMap';
import OperationRecordModal from './OperationRecordModal';

export type OperationCellNav =
  // CURRENT SITUATION
  | 'cop_map'
  | 'sigacts'
  | 'incident_board'
  | 'friendly_status'
  // CURRENT OPERATIONS
  | 'ongoing_missions'
  | 'unit_taskings'
  | 'movement_deployment'
  // REPORTING
  | 'spotrep'
  | 'directives';

interface OperationCellWorkspaceProps {
  records: RecordItem[];
  onSelectRecord: (record: RecordItem) => void;
  onOpenCreate: (category?: RecordCategory) => void;
  onSaveRecord?: (record: Partial<RecordItem>) => Promise<void> | void;
  onDeleteRecord?: (id: string) => Promise<void> | void;
  onRefreshData?: () => Promise<void> | void;
  dutyOfficer?: string;
  callsign?: string;
}

export default function OperationCellWorkspace({
  records,
  onSelectRecord,
  onOpenCreate,
  onSaveRecord,
  onDeleteRecord,
  onRefreshData,
  dutyOfficer = 'Maj. Marcus Vance',
  callsign = 'OVERLORD-ACTUAL',
}: OperationCellWorkspaceProps) {
  const [activeNav, setActiveNav] = useState<OperationCellNav>('cop_map');
  const [isOpRecordModalOpen, setIsOpRecordModalOpen] = useState(false);
  const [selectedOpRecord, setSelectedOpRecord] = useState<RecordItem | null>(null);

  // SIGACTS Table and Filter States
  const [sigactViewMode, setSigactViewMode] = useState<'table' | 'cards'>('table');
  const [incidentBoardViewMode, setIncidentBoardViewMode] = useState<'board' | 'table'>('board');
  const [sigactPriorityFilter, setSigactPriorityFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigactsExpanded, setIsSigactsExpanded] = useState(true);

  // ── Force Units State ──────────────────────────────────────────────────────
  const [forceUnits, setForceUnits] = useState<ForceUnit[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('force_units');
      const parsed: ForceUnit[] = stored ? JSON.parse(stored) : [];
      const logoCache = JSON.parse(localStorage.getItem('tactical_unit_logos') || '{}');
      return parsed.map((u) => ({
        ...u,
        logo_url: u.logo_url || logoCache[u.id] || (u.battalion ? logoCache[u.battalion] : '') || '',
      }));
    } catch { return []; }
  });
  const [isForceModalOpen, setIsForceModalOpen] = useState(false);
  const [editingForceUnit, setEditingForceUnit] = useState<ForceUnit | null>(null);

  // ── Unit Taskings State ────────────────────────────────────────────────────
  const [unitTaskings, setUnitTaskings] = useState<UnitTasking[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('unit_taskings');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [isTaskingModalOpen, setIsTaskingModalOpen] = useState(false);
  const [editingTasking, setEditingTasking] = useState<UnitTasking | null>(null);
  const [supabaseUnits, setSupabaseUnits] = useState<Array<{ id: string; label: string }>>([]);

  // ── Movement & Deployment State ────────────────────────────────────────────
  const [movementDeployments, setMovementDeployments] = useState<MovementDeployment[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('movement_deployments');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<MovementDeployment | null>(null);

  // ── Spot Reports State ─────────────────────────────────────────────────────
  const [spotReports, setSpotReports] = useState<SpotReport[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('spot_reports');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [isSpotReportModalOpen, setIsSpotReportModalOpen] = useState(false);
  const [editingSpotReport, setEditingSpotReport] = useState<SpotReport | null>(null);

  // ── Operational Directives State ──────────────────────────────────────────
  const [directives, setDirectives] = useState<OperationalDirective[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('operational_directives');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [isDirectiveModalOpen, setIsDirectiveModalOpen] = useState(false);
  const [editingDirective, setEditingDirective] = useState<OperationalDirective | null>(null);
  const [viewingDirective, setViewingDirective] = useState<OperationalDirective | null>(null);
  const [directiveSearch, setDirectiveSearch] = useState('');
  const [directiveTypeFilter, setDirectiveTypeFilter] = useState('all');
  const [directivePriorityFilter, setDirectivePriorityFilter] = useState('all');
  const [directiveStatusFilter, setDirectiveStatusFilter] = useState('all');

  // ── Operational Map Incidents & MGRS State ────────────────────────────────
  const [supabaseIncidents, setSupabaseIncidents] = useState<RecordItem[]>([]);
  const [selectedIncidentForBox, setSelectedIncidentForBox] = useState<RecordItem | null>(null);
  const [mapFocusedId, setMapFocusedId] = useState<string | null>(null);
  const [copiedMGRS, setCopiedMGRS] = useState(false);
  const [isSyncingIncidents, setIsSyncingIncidents] = useState(false);

  // Re-usable fetcher for incidents & units from Supabase with MGRS coordinates
  // Fetch incidents exclusively from the dedicated 'incidents' SQL table in Supabase
  const fetchSupabaseIncidents = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    setIsSyncingIncidents(true);
    try {
      const { data: dedicatedData, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (dedicatedData && dedicatedData.length > 0) {
        const dedicatedMap: RecordItem[] = dedicatedData.map((inc: any) => {
          let lat = Number(inc.lat) || 0;
          let lng = Number(inc.lng) || 0;
          let mgrs = inc.mgrs || inc.metadata?.mgrs || '';

          if (mgrs) {
            const parsed = parseMGRSToCoords(mgrs);
            if (parsed) {
              lat = parsed[0];
              lng = parsed[1];
            }
          } else if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
            mgrs = toMGRS(lat, lng);
          } else if (inc.area || inc.location_name) {
            const loc = inc.area || inc.location_name;
            for (const [area, c] of Object.entries(PRESET_AREA_COORDS)) {
              if (loc.toLowerCase().includes(area.toLowerCase())) {
                lat = c[0];
                lng = c[1];
                mgrs = toMGRS(c[0], c[1]);
                break;
              }
            }
          }

          return {
            id: inc.id,
            code: inc.code || `INC-${Math.floor(100 + Math.random() * 900)}`,
            title: inc.title || `${inc.operation_type || 'Incident'} — ${inc.area || 'AOR'}`,
            category: 'incidents' as RecordCategory,
            description: inc.narrative || inc.description || '',
            status: inc.status || 'active',
            priority: inc.priority || 'medium',
            lat,
            lng,
            location_name: inc.area || inc.location_name || '',
            metadata: {
              ...(inc.metadata || {}),
              mgrs,
              area: inc.area || inc.location_name,
              operation_type: inc.operation_type,
              narrative: inc.narrative || inc.description,
              result: inc.narrative || inc.description,
              dtg: inc.dtg,
              operation_date: inc.incident_date || inc.created_at,
            },
            created_at: inc.created_at,
            updated_at: inc.updated_at,
          } as RecordItem;
        });

        setSupabaseIncidents(dedicatedMap);
        safeLocalStorageSet('operational_incidents', JSON.stringify(dedicatedMap));
      }
    } catch (err) {
      console.warn('Dedicated incidents table fetch notice:', err);
    } finally {
      setIsSyncingIncidents(false);
    }
  };

  // Load from Supabase on mount — merge with localStorage (Supabase wins)
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    (async () => {
      // 1. Fetch force_units with persistent logo merge
      try {
        const { data } = await supabase.from('force_units').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          const logoCache = (() => {
            try { return JSON.parse(localStorage.getItem('tactical_unit_logos') || '{}'); } catch { return {}; }
          })();
          const enriched = (data as ForceUnit[]).map((u) => ({
            ...u,
            logo_url: u.logo_url || logoCache[u.id] || (u.battalion ? logoCache[u.battalion] : '') || '',
          }));
          setForceUnits(enriched);
          localStorage.setItem('force_units', JSON.stringify(enriched));
        }
      } catch { /* table may not exist yet — silent */ }

      // 2. Fetch unit_taskings (MGRS only — sanitize and remove any legacy lat/long)
      try {
        const { data: taskData, error: taskError } = await supabase.from('unit_taskings').select('*').order('created_at', { ascending: false });
        if (taskError) {
          console.warn('Supabase unit_taskings table query notice:', taskError.message);
        } else if (taskData && taskData.length > 0) {
          const sanitized = taskData.map((t: any) => {
            let mgrsVal = (t.mgrs || '').trim();
            // If legacy record had lat/lng without MGRS, convert it once to MGRS
            if (!mgrsVal && (t.lat || t.latitude) && (t.lng || t.longitude)) {
              mgrsVal = toMGRS(Number(t.lat || t.latitude), Number(t.lng || t.longitude));
            }
            return {
              id: t.id,
              assigned_unit_id: t.assigned_unit_id || '',
              assigned_unit_label: t.assigned_unit_label || '',
              directive_details: t.directive_details || '',
              priority: t.priority || 'medium',
              mgrs: mgrsVal,
              status: t.status || 'pending',
              task_date: t.task_date || new Date().toISOString().slice(0, 10),
              created_at: t.created_at || new Date().toISOString(),
              updated_at: t.updated_at || new Date().toISOString(),
            } as UnitTasking;
          });
          setUnitTaskings(sanitized);
          localStorage.setItem('unit_taskings', JSON.stringify(sanitized));
        }
      } catch { /* table may not exist yet — silent */ }

      // 3. Fetch movement_deployments
      try {
        const { data: moveData } = await supabase.from('movement_deployments').select('*').order('created_at', { ascending: false });
        if (moveData && moveData.length > 0) {
          setMovementDeployments(moveData as MovementDeployment[]);
          localStorage.setItem('movement_deployments', JSON.stringify(moveData));
        }
      } catch { /* table may not exist yet — silent */ }

      // 4. Fetch spot_reports
      try {
        const { data: spotData } = await supabase.from('spot_reports').select('*').order('created_at', { ascending: false });
        if (spotData && spotData.length > 0) {
          setSpotReports(spotData as SpotReport[]);
          localStorage.setItem('spot_reports', JSON.stringify(spotData));
        }
      } catch { /* table may not exist yet — silent */ }

      // 4b. Fetch operational_directives
      try {
        const { data: dirData } = await supabase.from('operational_directives').select('*').order('created_at', { ascending: false });
        if (dirData && dirData.length > 0) {
          setDirectives(dirData as OperationalDirective[]);
          localStorage.setItem('operational_directives', JSON.stringify(dirData));
        } else {
          // Fallback to records table
          const { data: recDirectives } = await supabase.from('records').select('*').eq('category', 'documents').order('created_at', { ascending: false });
          if (recDirectives && recDirectives.length > 0) {
            const mappedDirs: OperationalDirective[] = recDirectives
              .filter((r: any) => r.metadata?.is_directive === true)
              .map((r: any) => ({
                id: r.id,
                directive_number: r.code || `DIR-${r.id.slice(0, 6)}`,
                title: r.title,
                directive_type: r.metadata?.directive_type || 'Command Directive',
                issuing_authority: r.metadata?.issuing_authority || 'G3 Operations',
                target_units: r.metadata?.target_units || 'All Task Force Elements',
                priority: (r.priority || 'high') as any,
                classification: r.metadata?.classification || 'SECRET',
                effective_date: r.metadata?.effective_date || r.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                location_aor: r.location_name || '',
                narrative: r.description || '',
                status: (r.status === 'active' ? 'active' : r.metadata?.directive_status || 'active') as any,
                file_name: r.metadata?.file_name,
                file_size: r.metadata?.file_size,
                file_type: r.metadata?.file_type,
                file_data: r.metadata?.file_data,
                created_at: r.created_at,
                updated_at: r.updated_at,
              }));
            if (mappedDirs.length > 0) {
              setDirectives(mappedDirs);
              localStorage.setItem('operational_directives', JSON.stringify(mappedDirs));
            }
          }
        }
      } catch { /* table may not exist yet — silent */ }

      // 5. Fetch all units from 'units' table and 'records' table
      try {
        const unitList: Array<{ id: string; label: string }> = [];
        const { data: uData } = await supabase.from('units').select('*');
        if (uData && Array.isArray(uData)) {
          uData.forEach((u: any) => {
            const label = u.name || u.title || (u.battalion ? `${u.battalion} / ${u.brigade || ''}` : '') || u.code || u.id;
            unitList.push({ id: u.id, label });
          });
        }
        const { data: recUnits } = await supabase.from('records').select('*').eq('category', 'units');
        if (recUnits && Array.isArray(recUnits)) {
          recUnits.forEach((r: any) => {
            const label = `${r.code ? `[${r.code}] ` : ''}${r.title}${r.location_name ? ` — ${r.location_name}` : ''}`;
            if (!unitList.some(item => item.id === r.id)) {
              unitList.push({ id: r.id, label });
            }
          });
        }
        if (unitList.length > 0) {
          setSupabaseUnits(unitList);
        }
      } catch { /* silent */ }

      // 6. Fetch incidents from Supabase dedicated incidents table
      await fetchSupabaseIncidents();
    })();
  }, []);

  // Realtime Supabase Auto-Refresh: listen for changes on dedicated public.incidents table
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const client = supabase;

    const channel = client
      .channel('incidents-table-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incidents' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            fetchSupabaseIncidents();
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setSupabaseIncidents((prev) => prev.filter((i) => i.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const safeLocalStorageSet = (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] QuotaExceededError writing key "${key}". Running recovery...`);
      try {
        if (key === 'force_units') {
          // If force_units exceeds quota, save a lightweight copy in localStorage without data: base64
          // Memory state (setForceUnits) and Supabase database retain the complete object with logo_url
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            const stripped = parsed.map((u: any) => ({
              ...u,
              logo_url: u.logo_url && u.logo_url.startsWith('data:') ? '' : u.logo_url,
            }));
            localStorage.setItem(key, JSON.stringify(stripped));
            return;
          }
        }
        // Remove transient caches to free up quota
        localStorage.removeItem('tactical_unit_logos');
        localStorage.setItem(key, value);
      } catch {
        console.warn(`[Storage] Storage quota exhausted. Continuing with in-memory & Supabase persistence.`);
      }
    }
  };

  const handleSaveForceUnit = async (unit: ForceUnit) => {
    // 1. Update React memory state immediately
    const isEdit = forceUnits.some((u) => u.id === unit.id);
    const updated = isEdit
      ? forceUnits.map((u) => (u.id === unit.id ? unit : u))
      : [unit, ...forceUnits];
    setForceUnits(updated);

    // 2. Safely store in localStorage (protected from QuotaExceededError)
    safeLocalStorageSet('force_units', JSON.stringify(updated));

    // 3. Cache logo locally with deduplication (pointer for battalion to save quota)
    if (unit.logo_url) {
      try {
        const rawCache = localStorage.getItem('tactical_unit_logos');
        const logoCache = rawCache ? JSON.parse(rawCache) : {};
        logoCache[unit.id] = unit.logo_url;
        if (unit.battalion && unit.battalion !== unit.id) {
          logoCache[unit.battalion] = unit.id;
        }
        safeLocalStorageSet('tactical_unit_logos', JSON.stringify(logoCache));
      } catch { /* silent */ }
    }

    // 4. Authoritative persistence to Supabase
    if (isSupabaseConfigured() && supabase) {
      // Upsert to force_units table
      try {
        const { error } = await supabase.from('force_units').upsert([unit]);
        if (error) {
          // If remote force_units table doesn't have logo_url or mgrs column yet:
          if (error.code === 'PGRST204' || error.message?.includes('logo_url') || error.message?.includes('mgrs')) {
            const cleanUnit = { ...unit } as any;
            if (error.message?.includes('logo_url')) delete cleanUnit.logo_url;
            if (error.message?.includes('mgrs')) delete cleanUnit.mgrs;
            const { error: fallbackError } = await supabase.from('force_units').upsert([cleanUnit]);
            if (fallbackError) {
              console.warn('Supabase force_units fallback upsert notice:', fallbackError.message);
            }
          } else {
            console.warn('Supabase force_units upsert notice:', error.message);
          }
        }
      } catch (err) {
        console.warn('Supabase force_units sync exception:', err);
      }

      // Mirror to unified records table (requires valid UUID for PostgreSQL)
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(unit.id);
        const recordId = isUUID ? unit.id : crypto.randomUUID();
        const recordMirror = {
          id: recordId,
          code: unit.battalion || 'UNIT',
          title: `${unit.battalion} (${unit.brigade})`,
          category: 'units' as RecordCategory,
          status: 'active' as RecordStatus,
          priority: 'medium' as any,
          location_name: unit.area || 'AOR Station',
          description: `Force Unit: ${unit.battalion} / ${unit.brigade}. Officers: ${unit.afp_officers || 0}, Enlisted: ${unit.afp_enlisted || 0}`,
          metadata: {
            ...unit,
            is_force_unit: true,
            logo_url: unit.logo_url,
          },
          updated_at: new Date().toISOString(),
        };
        const { error: recError } = await supabase.from('records').upsert([recordMirror]);
        if (recError) {
          console.warn('Supabase records mirror notice:', recError.message);
        }
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.warn('Supabase records mirror error:', err);
      }
    }
  };

  const handleDeleteForceUnit = (id: string) => {
    if (!confirm('Delete this unit record?')) return;
    const targetUnit = forceUnits.find((u) => u.id === id);
    const updated = forceUnits.filter((u) => u.id !== id);
    setForceUnits(updated);
    safeLocalStorageSet('force_units', JSON.stringify(updated));

    // Clear from local logo cache
    try {
      const logoCache = JSON.parse(localStorage.getItem('tactical_unit_logos') || '{}');
      delete logoCache[id];
      if (targetUnit?.battalion) delete logoCache[targetUnit.battalion];
      safeLocalStorageSet('tactical_unit_logos', JSON.stringify(logoCache));
    } catch { /* silent */ }

    if (isSupabaseConfigured() && supabase) {
      (async () => {
        try { await supabase.from('force_units').delete().eq('id', id); } catch { /* silent */ }
        try { await supabase.from('records').delete().eq('id', id); } catch { /* silent */ }
      })();
    }
  };

  const handleSaveUnitTasking = async (tasking: UnitTasking) => {
    // Explicitly strip any lat/long fields so Supabase only stores MGRS
    const { lat, lng, latitude, longitude, ...cleanTasking } = tasking as any;

    const isEdit = unitTaskings.some((t) => t.id === cleanTasking.id);
    const updated = isEdit
      ? unitTaskings.map((t) => (t.id === cleanTasking.id ? cleanTasking : t))
      : [cleanTasking, ...unitTaskings];
    setUnitTaskings(updated);
    safeLocalStorageSet('unit_taskings', JSON.stringify(updated));
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('unit_taskings').upsert([cleanTasking]);
        if (error) {
          console.warn('Supabase unit_taskings upsert notice:', error.message);
        }
      } catch (err) {
        console.warn('Supabase unit_taskings sync failed:', err);
      }
    }
  };

  const handleDeleteUnitTasking = (id: string) => {
    if (!confirm('Delete this unit tasking directive?')) return;
    const updated = unitTaskings.filter((t) => t.id !== id);
    setUnitTaskings(updated);
    safeLocalStorageSet('unit_taskings', JSON.stringify(updated));
    if (isSupabaseConfigured() && supabase) {
      (async () => {
        try { await supabase.from('unit_taskings').delete().eq('id', id); } catch { /* silent */ }
      })();
    }
  };

  const handleSaveMovement = async (movement: MovementDeployment) => {
    const isEdit = movementDeployments.some((m) => m.id === movement.id);
    const updated = isEdit
      ? movementDeployments.map((m) => (m.id === movement.id ? movement : m))
      : [movement, ...movementDeployments];
    setMovementDeployments(updated);
    safeLocalStorageSet('movement_deployments', JSON.stringify(updated));
    if (isSupabaseConfigured() && supabase) {
      try { await supabase.from('movement_deployments').upsert([movement]); } catch { /* silent */ }
    }
  };

  const handleDeleteMovement = (id: string) => {
    if (!confirm('Delete this movement/deployment record?')) return;
    const updated = movementDeployments.filter((m) => m.id !== id);
    setMovementDeployments(updated);
    safeLocalStorageSet('movement_deployments', JSON.stringify(updated));
    if (isSupabaseConfigured() && supabase) {
      (async () => {
        try { await supabase.from('movement_deployments').delete().eq('id', id); } catch { /* silent */ }
      })();
    }
  };

  const handleSaveSpotReport = async (report: SpotReport) => {
    const isEdit = spotReports.some((r) => r.id === report.id);
    const updated = isEdit
      ? spotReports.map((r) => (r.id === report.id ? report : r))
      : [report, ...spotReports];
    setSpotReports(updated);
    safeLocalStorageSet('spot_reports', JSON.stringify(updated));
    if (isSupabaseConfigured() && supabase) {
      try { await supabase.from('spot_reports').upsert([report]); } catch { /* silent */ }
    }
  };

  const handleDeleteSpotReport = (id: string) => {
    if (!confirm('Delete this spot report?')) return;
    const updated = spotReports.filter((r) => r.id !== id);
    setSpotReports(updated);
    safeLocalStorageSet('spot_reports', JSON.stringify(updated));
    if (isSupabaseConfigured() && supabase) {
      (async () => {
        try { await supabase.from('spot_reports').delete().eq('id', id); } catch { /* silent */ }
      })();
    }
  };

  const handleSaveDirective = async (directive: OperationalDirective) => {
    const isEdit = directives.some((d) => d.id === directive.id);
    const updated = isEdit
      ? directives.map((d) => (d.id === directive.id ? directive : d))
      : [directive, ...directives];
    setDirectives(updated);
    safeLocalStorageSet('operational_directives', JSON.stringify(updated));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('operational_directives').upsert([directive]);
      } catch {
        /* proceed to records fallback */
      }
      try {
        const recordMirror: Partial<RecordItem> = {
          id: directive.id,
          code: directive.directive_number,
          title: `[${directive.directive_type}] ${directive.title}`,
          category: 'documents' as RecordCategory,
          description: directive.narrative,
          status: directive.status === 'active' || directive.status === 'in_execution' ? 'active' : 'pending',
          priority: directive.priority === 'routine' ? 'low' : directive.priority,
          location_name: directive.location_aor,
          metadata: {
            is_directive: true,
            directive_number: directive.directive_number,
            directive_type: directive.directive_type,
            issuing_authority: directive.issuing_authority,
            target_units: directive.target_units,
            classification: directive.classification,
            effective_date: directive.effective_date,
            directive_status: directive.status,
            file_name: directive.file_name,
            file_size: directive.file_size,
            file_type: directive.file_type,
            file_data: directive.file_data,
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

  const handleDeleteDirective = (id: string) => {
    if (!confirm('Permanently delete this Operational Directive?')) return;
    const updated = directives.filter((d) => d.id !== id);
    setDirectives(updated);
    safeLocalStorageSet('operational_directives', JSON.stringify(updated));

    if (isSupabaseConfigured() && supabase) {
      (async () => {
        try { await supabase.from('operational_directives').delete().eq('id', id); } catch { /* silent */ }
        try {
          await supabase.from('records').delete().eq('id', id);
          if (onRefreshData) onRefreshData();
        } catch { /* silent */ }
      })();
    }
  };

  const handleOpenOpRecord = (rec?: RecordItem | null) => {
    setSelectedOpRecord(rec || null);
    setIsOpRecordModalOpen(true);
  };

  const handleDeleteOpRecord = async (sig: RecordItem) => {
    const confirmMsg = `Are you sure you want to permanently delete incident "${sig.title}" (${sig.code}) from the dedicated incidents SQL table?`;
    if (!confirm(confirmMsg)) return;

    try {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase.from('incidents').delete().eq('id', sig.id);
          if (error) console.warn('Supabase incidents table delete notice:', error.message);
        } catch { /* silent */ }
      }
      setSupabaseIncidents((prev) => prev.filter((i) => i.id !== sig.id));
      try {
        const stored = localStorage.getItem('operational_incidents');
        if (stored) {
          const list = JSON.parse(stored).filter((i: any) => i.id !== sig.id);
          safeLocalStorageSet('operational_incidents', JSON.stringify(list));
        }
      } catch { /* silent */ }
    } catch (err) {
      console.error('Failed to delete incident record:', err);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchSupabaseIncidents();
      if (onRefreshData) {
        await onRefreshData();
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const formatZuluDTG = (dateStr: string) => {
    try {
      const d = dateStr ? new Date(dateStr) : new Date();
      const day = String(d.getUTCDate()).padStart(2, '0');
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const mins = String(d.getUTCMinutes()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[d.getUTCMonth()];
      const year = String(d.getUTCFullYear()).slice(-2);
      return `${day}${hours}${mins}Z ${month} ${year}`;
    } catch {
      return dateStr || '—';
    }
  };

  // Dedicated incidents from Supabase 'incidents' table (separate from unified records table)
  const incidents = useMemo(() => {
    const list: RecordItem[] = [];
    const seen = new Set<string>();

    // Supabase dedicated incidents table records
    supabaseIncidents.forEach((inc) => {
      if (inc.id && !seen.has(inc.id)) {
        seen.add(inc.id);
        list.push(inc);
      }
    });

    // Local cached operational incidents fallback (if offline or before initial network fetch)
    if (list.length === 0 && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('operational_incidents');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((inc: RecordItem) => {
              if (inc.id && !seen.has(inc.id)) {
                seen.add(inc.id);
                list.push(inc);
              }
            });
          }
        }
      } catch { /* silent */ }
    }

    return list;
  }, [supabaseIncidents]);

  const tasks = useMemo(() => records.filter((r) => r.category === 'tasks'), [records]);
  const units = useMemo(() => records.filter((r) => r.category === 'units'), [records]);
  const personnel = useMemo(() => records.filter((r) => r.category === 'personnel'), [records]);
  const locations = useMemo(() => records.filter((r) => r.category === 'locations'), [records]);
  const reports = useMemo(() => records.filter((r) => r.category === 'reports'), [records]);

  // Unified list of units for unit tasking dropdown: from supabase units table + records + forceUnits
  const allAvailableUnitOptions = useMemo(() => {
    const list: Array<{ id: string; label: string }> = [];
    const seen = new Set<string>();

    // 1. Units fetched from Supabase 'units' table or 'records' table
    supabaseUnits.forEach((u) => {
      if (u.id && !seen.has(u.id)) {
        seen.add(u.id);
        list.push(u);
      }
    });

    // 2. Units from records (category = 'units')
    units.forEach((r) => {
      if (r.id && !seen.has(r.id)) {
        seen.add(r.id);
        list.push({
          id: r.id,
          label: `${r.code ? `[${r.code}] ` : ''}${r.title}${r.location_name ? ` — ${r.location_name}` : ''}`,
        });
      }
    });

    // 3. Force units added in Forces Status tab
    forceUnits.forEach((fu) => {
      if (fu.id && !seen.has(fu.id)) {
        seen.add(fu.id);
        list.push({
          id: fu.id,
          label: `${fu.battalion} / ${fu.brigade}${fu.area ? ` — ${fu.area}` : ''}`,
        });
      }
    });

    return list;
  }, [supabaseUnits, units, forceUnits]);

  // Suggestions for Unit/People input in Movement Modal
  const unitPeopleSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    allAvailableUnitOptions.forEach((u) => {
      if (u.label && !suggestions.includes(u.label)) {
        suggestions.push(u.label);
      }
    });
    personnel.forEach((p) => {
      const pLabel = `${p.title}${p.code ? ` (${p.code})` : ''}`;
      if (!suggestions.includes(pLabel)) {
        suggestions.push(pLabel);
      }
    });
    return suggestions;
  }, [allAvailableUnitOptions, personnel]);

  // Convert Unit Taskings into map records based on their MGRS coordinates
  const taskingRecords: RecordItem[] = useMemo(() => {
    return unitTaskings
      .filter((t) => Boolean(t.mgrs && t.mgrs.trim()))
      .map((t) => {
        let coords = parseMGRSToCoords(t.mgrs);
        if (!coords && t.mgrs) {
          const parts = t.mgrs.split(',').map((s) => parseFloat(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            coords = [parts[0], parts[1]];
          } else {
            for (const [areaName, c] of Object.entries(PRESET_AREA_COORDS)) {
              if (t.mgrs.toLowerCase().includes(areaName.toLowerCase())) {
                coords = c;
                break;
              }
            }
          }
        }

        const matchedUnit = forceUnits.find(
          (fu) =>
            fu.id === t.assigned_unit_id ||
            fu.battalion === t.assigned_unit_label ||
            Boolean(t.assigned_unit_label && fu.battalion && t.assigned_unit_label.includes(fu.battalion))
        );

        return {
          id: `tasking-${t.id}`,
          title: t.assigned_unit_label ? `${t.assigned_unit_label}` : 'Unit Tasking Directive',
          category: 'tasks' as RecordCategory,
          status: (t.status === 'completed' || t.status === 'cancelled'
            ? 'closed'
            : t.status === 'active'
            ? 'active'
            : 'pending') as RecordStatus,
          priority: t.priority,
          lat: coords ? coords[0] : 0,
          lng: coords ? coords[1] : 0,
          location_name: `Grid: ${t.mgrs}`,
          description: t.directive_details || 'Tactical directive assigned to unit.',
          code: `TASK-${(t.assigned_unit_label || 'UNIT').slice(0, 6).toUpperCase().replace(/\s+/g, '')}`,
          metadata: {
            mgrs: t.mgrs,
            is_unit_tasking: true,
            assigned_unit_label: t.assigned_unit_label,
            task_date: t.task_date,
            logo_url: matchedUnit?.logo_url,
          },
          created_at: t.created_at || new Date().toISOString(),
          updated_at: t.updated_at || new Date().toISOString(),
        };
      });
  }, [unitTaskings, forceUnits]);

  // Mapped units from Supabase force_units table + records units for COP GIS Grid Map
  const mappedUnits: RecordItem[] = useMemo(() => {
    const list: RecordItem[] = [];
    const seen = new Set<string>();

    const logoCache: Record<string, string> = (() => {
      try {
        return JSON.parse(localStorage.getItem('tactical_unit_logos') || '{}');
      } catch {
        return {};
      }
    })();

    // 1. Map forceUnits fetched from Supabase force_units table
    forceUnits.forEach((fu, index) => {
      if (fu.id && !seen.has(fu.id)) {
        seen.add(fu.id);
        const areaStr = fu.area || 'Cotabato';
        let baseCoords = PRESET_AREA_COORDS[areaStr];
        if (!baseCoords) {
          for (const [key, c] of Object.entries(PRESET_AREA_COORDS)) {
            if (areaStr.toLowerCase().includes(key.toLowerCase())) {
              baseCoords = c;
              break;
            }
          }
        }
        if (!baseCoords) {
          baseCoords = [7.2236, 124.2464]; // default Cotabato
        }

        // Check if unit has a specific MGRS entered
        let lat = baseCoords[0];
        let lng = baseCoords[1];
        let mgrs = (fu.mgrs || '').trim();

        if (mgrs) {
          const parsed = parseMGRSToCoords(mgrs);
          if (parsed) {
            lat = parsed[0];
            lng = parsed[1];
          }
        } else {
          // Apply a small tactical dispersion offset so units in the same area don't overlap exactly
          const angle = (index * 51.4) * (Math.PI / 180);
          const radius = 0.012 * ((index % 3) + 1);
          lat = Number((baseCoords[0] + Math.sin(angle) * radius).toFixed(5));
          lng = Number((baseCoords[1] + Math.cos(angle) * radius).toFixed(5));
          mgrs = toMGRS(lat, lng);
        }

        const unitLogo = fu.logo_url || logoCache[fu.id] || (fu.battalion ? logoCache[fu.battalion] : '') || '';

        list.push({
          id: `fu-${fu.id}`,
          code: fu.battalion || 'UNIT',
          title: `${fu.battalion} (${fu.brigade})`,
          category: 'units' as RecordCategory,
          status: 'active' as RecordStatus,
          priority: 'medium',
          lat,
          lng,
          location_name: fu.area || 'AOR Station',
          description: `Force Unit: ${fu.battalion} / ${fu.brigade}. Officers: ${fu.afp_officers || 0}, Enlisted: ${fu.afp_enlisted || 0}, CAA: ${fu.caa || 0}, WAVS/TAVS: ${fu.wavs_tavs || 0}, ISR: ${fu.isr_asset || 0}, Vehicles: ${fu.vehicle || 0}, Artillery: ${fu.artillery_asset || 0}`,
          metadata: {
            mgrs,
            is_force_unit: true,
            battalion: fu.battalion,
            brigade: fu.brigade,
            area: fu.area,
            afp_officers: fu.afp_officers,
            afp_enlisted: fu.afp_enlisted,
            wavs_tavs: fu.wavs_tavs,
            isr_asset: fu.isr_asset,
            vehicle: fu.vehicle,
            artillery_asset: fu.artillery_asset,
            logo_url: unitLogo,
          },
          created_at: fu.created_at || new Date().toISOString(),
          updated_at: fu.updated_at || new Date().toISOString(),
        });
      }
    });

    // 2. Units from records prop (category === 'units')
    units.forEach((u) => {
      if (u.id && !seen.has(u.id)) {
        seen.add(u.id);
        const resolved = resolveCoordinates(u);
        const lat = resolved ? resolved[0] : Number(u.lat) || 7.2236;
        const lng = resolved ? resolved[1] : Number(u.lng) || 124.2464;
        const mgrs = u.metadata?.mgrs || toMGRS(lat, lng);
        const unitLogo =
          u.metadata?.logo_url ||
          logoCache[u.id] ||
          (u.code ? logoCache[u.code] : '') ||
          (u.title ? logoCache[u.title] : '') ||
          '';
        list.push({
          ...u,
          lat,
          lng,
          category: 'units' as RecordCategory,
          metadata: {
            ...(u.metadata || {}),
            mgrs,
            logo_url: unitLogo,
          },
        });
      }
    });

    return list;
  }, [forceUnits, units]);

  // COP Map layer filter - Display ONLY Incidents and Units (Strictly excluding any PIAGs)
  const [copLayer, setCopLayer] = useState<'all' | 'incidents' | 'units'>('all');
  const copRecords = useMemo(() => {
    const filterOutPiags = (arr: RecordItem[]) =>
      arr.filter((r) => {
        const isPiag =
          r.metadata?.is_piag === true ||
          r.metadata?.cmo_type === 'piag' ||
          (r.code && String(r.code).startsWith('PIAG-')) ||
          (r.title && String(r.title).startsWith('[PIAG]'));
        return !isPiag;
      });

    if (copLayer === 'incidents') return filterOutPiags(incidents);
    if (copLayer === 'units') return filterOutPiags(mappedUnits);
    return filterOutPiags([...incidents, ...mappedUnits]);
  }, [copLayer, incidents, mappedUnits]);

  // SIGACTS search & priority filter
  const [sigactSearch, setSigactSearch] = useState('');
  const [spotReportSearch, setSpotReportSearch] = useState('');
  const filteredSigacts = useMemo(() => {
    return incidents.filter((r) => {
      const matchText =
        !sigactSearch ||
        r.title.toLowerCase().includes(sigactSearch.toLowerCase()) ||
        r.code.toLowerCase().includes(sigactSearch.toLowerCase()) ||
        (r.location_name && r.location_name.toLowerCase().includes(sigactSearch.toLowerCase())) ||
        (r.metadata?.mgrs && r.metadata.mgrs.toLowerCase().includes(sigactSearch.toLowerCase())) ||
        (r.metadata?.operation_type && r.metadata.operation_type.toLowerCase().includes(sigactSearch.toLowerCase())) ||
        (r.description && r.description.toLowerCase().includes(sigactSearch.toLowerCase()));
      const matchPriority = sigactPriorityFilter === 'all' || r.priority === sigactPriorityFilter;
      return matchText && matchPriority;
    });
  }, [incidents, sigactSearch, sigactPriorityFilter]);

  // SPOTREP form state (SALUTE format)
  const [spotrepForm, setSpotrepForm] = useState({
    size: '3x Unidentified Personnel + 1 Light Vehicle',
    activity: 'Erecting surveillance tripod near northern perimeter',
    location: 'Grid 37.7749, -122.4194 (Downtown Sector 4)',
    unit: 'Hostile reconnaissance militia in dark fatigues',
    time: new Date().toTimeString().split(' ')[0] + ' UTC',
    equipment: 'Optical rangefinder, VHF radio, small arms',
  });

  const [spotrepHistory, setSpotrepHistory] = useState<Array<{ id: string; time: string; location: string; activity: string }>>([
    {
      id: 'sp-1',
      time: '07:42Z',
      location: 'Substation Gamma (Grid 37.7600, -122.4300)',
      activity: 'Drone surveillance telemetry detected hovering at 400ft AGL.',
    },
  ]);

  const handleSendSpotrep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotrepForm.activity.trim()) return;
    const newEntry = {
      id: 'sp-' + Date.now(),
      time: new Date().toTimeString().split(' ')[0] + ' UTC',
      location: spotrepForm.location,
      activity: `${spotrepForm.size}: ${spotrepForm.activity}`,
    };
    setSpotrepHistory((prev) => [newEntry, ...prev]);
    alert('TACTICAL SPOTREP TRANSMITTED TO COMMAND SATELLITE');
  };

  // Nav structure organized exactly by user request
  const navGroups: Array<{
    title: string;
    items: Array<{
      id: OperationCellNav;
      label: string;
      icon: any;
      badge?: string | number;
      badgeColor?: string;
    }>;
  }> = [
    {
      title: 'CURRENT SITUATION',
      items: [
	  
	   { id: 'cop_map', label: 'Operational map', icon: Map, badge: copRecords.length },
        {
          id: 'sigacts',
          label: 'Significant activities',
          icon: Activity,
          badge: incidents.filter((i) => i.priority === 'critical' || i.priority === 'high').length,
          badgeColor: 'text-blue-700 bg-rose-950 border-rose-800',
        },
       
        { id: 'incident_board', label: 'Incident board', icon: AlertTriangle, badge: incidents.length },
        { id: 'friendly_status', label: 'Forces Status', icon: Users, badge: `${units.length} Units` },
      ],
    },
    {
      title: 'CURRENT OPERATIONS',
      items: [

        { id: 'unit_taskings', label: 'Unit taskings', icon: CheckSquare, badge: unitTaskings.length },
        {
          id: 'movement_deployment',
          label: 'Movement/deployment status',
          icon: Truck,
          badge: movementDeployments.length,
        },
      ],
    },
    {
      title: 'REPORTING',
      items: [
        { id: 'spotrep', label: 'SPOTREP', icon: FileWarning, badge: spotReports.length, badgeColor: 'text-blue-700 bg-rose-950 border-rose-800' },
        { id: 'directives', label: 'Directive', icon: FileText, badge: directives.length, badgeColor: 'text-blue-600 bg-cyan-950 border-cyan-800' },
      ],
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* ── 1. HORIZONTAL OPS TACTICAL NAVIGATION (ABOVE SIGNIFICANT ACTIVITIES) ── */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
       
        
        {/* Horizontal nav tabs — grouped by section label */}
        <div className="flex items-stretch overflow-x-auto divide-x divide-slate-100">
          {navGroups.map((group) => (
            <div key={group.title} className="flex flex-col shrink-0">
              {/* Section label */}
              <div className="text-[9px] font-sans uppercase tracking-widest text-slate-500 font-bold px-3 pt-1.5 pb-0.5 whitespace-nowrap">
                {group.title}
              </div>
              {/* Tab pills for this section */}
              <div className="flex items-center gap-1 px-2 pb-2 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveNav(item.id);
                        if (item.id === 'sigacts') {
                          setIsSigactsExpanded(true);
                        }
                      }}
                      title={item.label}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-sans whitespace-nowrap transition-all group shrink-0 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <Icon
                        className={`w-3 h-3 shrink-0 ${
                          isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-600'
                        }`}
                      />
                      <span className="truncate max-w-[110px]">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[9px] font-sans px-1 py-0.5 rounded border shrink-0 ${
                            item.badgeColor ||
                            (isActive
                              ? 'bg-blue-100 text-blue-800 border-blue-200 font-bold'
                              : 'bg-slate-100 text-slate-600 border-slate-200')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. SIGNIFICANT ACTIVITIES INCIDENT LEDGER — only on sigacts / incident_board ── */}
      {(activeNav === 'sigacts' || activeNav === 'incident_board') && (
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-sans font-bold text-slate-900 uppercase tracking-wide">
                Significant Activities (Incident Ledger) 
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {filteredSigacts.length} RECORDS
              </span>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Manual Refresh from Supabase */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Refresh data directly from Supabase"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-slate-900 text-xs font-sans transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            {/* View Mode Switcher: Table vs Cards */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 font-sans text-xs">
              <button
                onClick={() => setSigactViewMode('table')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] uppercase transition-all ${
                  sigactViewMode === 'table'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setSigactViewMode('cards')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] uppercase transition-all ${
                  sigactViewMode === 'cards'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
            </div>

            {/* Create New Operation Record Button */}
            <button
              onClick={() => handleOpenOpRecord(null)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Events/Incident</span>
            </button>

            {/* Collapse / Expand Toggle */}
            <button
              onClick={() => setIsSigactsExpanded(!isSigactsExpanded)}
              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              title={isSigactsExpanded ? 'Collapse Table' : 'Expand Table'}
            >
              {isSigactsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content body when expanded */}
        {isSigactsExpanded && (
          <div className="p-4 space-y-3.5">
            {/* Filters & Search Toolbar */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans text-xs">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by code, type, area, MGRS, narrative..."
                  value={sigactSearch}
                  onChange={(e) => setSigactSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Priority Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-500 uppercase mr-1">Priority:</span>
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map((pri) => (
                  <button
                    key={pri}
                    onClick={() => setSigactPriorityFilter(pri)}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      sigactPriorityFilter === pri
                        ? pri === 'critical'
                          ? 'bg-rose-950 text-slate-800 border border-rose-700'
                          : pri === 'high'
                          ? 'bg-amber-950 text-slate-800 border border-amber-700'
                          : pri === 'medium'
                          ? 'bg-cyan-950 text-blue-700 border border-cyan-700'
                          : 'bg-slate-800 text-slate-800 border border-slate-600'
                        : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {pri}
                  </button>
                ))}
              </div>
            </div>

            {/* Empty State */}
            {filteredSigacts.length === 0 && (
              <div className="p-8 rounded-lg bg-slate-50 border border-slate-200 text-center font-sans space-y-3">
                <Activity className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-slate-700 text-sm font-bold">No Incident Records Found</div>
                <p className="text-slate-500 text-xs max-w-md mx-auto">
                  {sigactSearch || sigactPriorityFilter !== 'all'
                    ? 'No incidents match your current search or priority filter criteria.'
                    : 'There are currently no incidents recorded in Supabase for this cell.'}
                </p>
                <button
                  onClick={() => handleOpenOpRecord(null)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Incident Record</span>
                </button>
              </div>
            )}

            {/* Table View */}
            {filteredSigacts.length > 0 && sigactViewMode === 'table' && (
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/90 shadow-2xl max-h-[460px] overflow-y-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-slate-200 bg-white text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-3.5 font-bold">Code</th>
                      <th className="py-3 px-3.5 font-bold">Date / DTG</th>
                      <th className="py-3 px-3.5 font-bold">Type</th>
                      <th className="py-3 px-3.5 font-bold">Area / Location</th>
                      <th className="py-3 px-3.5 font-bold">MGRS Grid Ref</th>
                      <th className="py-3 px-3.5 font-bold">Priority</th>
                      <th className="py-3 px-3.5 font-bold">Status</th>
                      <th className="py-3 px-3.5 font-bold max-w-xs">Result / Narrative</th>
                      <th className="py-3 px-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredSigacts.map((sig) => {
                      const priorityColor =
                        sig.priority === 'critical'
                          ? 'bg-rose-950 text-slate-800 border border-rose-800'
                          : sig.priority === 'high'
                          ? 'bg-amber-950 text-slate-800 border border-amber-800'
                          : sig.priority === 'medium'
                          ? 'bg-cyan-950 text-blue-700 border border-cyan-800'
                          : 'bg-slate-900 text-slate-500 border border-slate-800';

                      const statusColor =
                        sig.status === 'active'
                          ? 'bg-emerald-950 text-blue-600 border border-emerald-800'
                          : sig.status === 'pending'
                          ? 'bg-amber-950 text-blue-600 border border-amber-800'
                          : 'bg-slate-900 text-slate-500 border border-slate-800';

                      return (
                        <tr
                          key={sig.id}
                          className="hover:bg-white/60 transition-colors group cursor-default"
                        >
                          <td className="py-3 px-3.5 font-bold text-blue-700 whitespace-nowrap">
                            <span className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                              {sig.code}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-700">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{formatZuluDTG(sig.metadata?.operation_date || sig.created_at)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px]">
                              {sig.metadata?.operation_type || sig.title.split('—')[0].trim()}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-800">
                            <div className="flex items-center space-x-1.5">
                              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate max-w-[150px] font-semibold" title={sig.location_name}>
                                {sig.location_name || sig.metadata?.area || 'Classified'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {sig.metadata?.mgrs ? (
                              <span className="text-slate-800 font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] flex items-center space-x-1 w-fit">
                                <Compass className="w-3 h-3 text-blue-600" />
                                <span>{sig.metadata.mgrs}</span>
                              </span>
                            ) : (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${priorityColor}`}>
                              {sig.priority}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor}`}>
                              {sig.status}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 max-w-xs text-slate-700">
                            <p
                              className="line-clamp-2 leading-relaxed text-[11px] text-slate-700"
                              title={sig.description}
                            >
                              {sig.description || 'No narrative logged.'}
                            </p>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleOpenOpRecord(sig)}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-blue-700 hover:text-cyan-200 text-xs font-semibold transition-all shadow-sm active:scale-95"
                                title="Edit Incident Record in Supabase"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteOpRecord(sig)}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:text-slate-800 text-xs font-semibold transition-all shadow-sm active:scale-95"
                                title="Delete Incident Record from Supabase"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cards View */}
            {filteredSigacts.length > 0 && sigactViewMode === 'cards' && (
              <div className="space-y-2.5">
                {filteredSigacts.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-3.5 rounded-lg bg-white/80 hover:bg-slate-100 border border-slate-200 transition-all shadow-sm group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-sans text-xs font-bold text-blue-700 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                          {sig.code}
                        </span>
                        {sig.metadata?.operation_type && (
                          <span className="font-sans text-[10px] font-bold text-blue-700 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                            {sig.metadata.operation_type}
                          </span>
                        )}
                        <span className="font-semibold text-slate-800 text-sm">
                          {sig.title}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                            sig.priority === 'critical'
                              ? 'bg-rose-950 text-slate-800 border border-rose-800'
                              : 'bg-amber-950 text-slate-800 border border-amber-800'
                          }`}
                        >
                          {sig.priority}
                        </span>
                      </div>
                      <div className="text-[11px] font-sans text-slate-500 flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatZuluDTG(sig.metadata?.operation_date || sig.created_at)}</span>
                      </div>
                    </div>

                    <p className="text-xs font-sans text-slate-700 mt-2 leading-relaxed">
                      {sig.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between mt-3 pt-2 border-t border-slate-200 text-[11px] font-sans text-slate-500 gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-slate-700">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>{sig.location_name || 'Location Classified'}</span>
                        </div>
                        {sig.metadata?.mgrs && (
                          <span className="text-slate-800 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/80 text-[10px] flex items-center space-x-1">
                            <Compass className="w-3 h-3 text-blue-600" />
                            <span>MGRS: {sig.metadata.mgrs}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenOpRecord(sig)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-blue-700 text-xs font-semibold transition-all"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit Record</span>
                        </button>
                        <button
                          onClick={() => handleDeleteOpRecord(sig)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-rose-950 border border-slate-200 hover:border-rose-700 text-blue-700 hover:text-slate-800 text-xs font-semibold transition-all"
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
      </div>
      )} {/* end SIGACTS conditional */}

      {/* ── Full-Width Content Panel ── */}
      <div className="space-y-4">
          {/* ========================================================================= */}
          {/* 1. COP / OPERATIONAL MAP */}
          {/* ========================================================================= */}
          {activeNav === 'cop_map' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md font-sans">
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                    <Map className="w-5 h-5 text-blue-600" />
                    <span>Operational Map</span>
                  </h2>
                 
                </div>

                {/* Layer Filters & Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={fetchSupabaseIncidents}
                    disabled={isSyncingIncidents}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 hover:border-rose-700 text-slate-800 hover:text-rose-200 text-xs font-semibold transition-all active:scale-95"
                    title="Fetch and sync incidents with MGRS coordinates from Supabase"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingIncidents ? 'animate-spin text-blue-700' : ''}`} />
                    <span>{isSyncingIncidents ? 'Syncing...' : 'Refresh'}</span>
                  </button>

                  <div className="flex items-center space-x-1.5 p-1 rounded-md bg-slate-50 border border-slate-200 text-xs">
                    {(['all', 'incidents', 'units'] as const).map((layer) => (
                      <button
                        key={layer}
                        onClick={() => setCopLayer(layer)}
                        className={`px-2.5 py-1 rounded text-[11px] uppercase transition-all ${
                          copLayer === layer
                            ? 'bg-amber-500/20 text-slate-800 border border-amber-500/40 font-bold'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {layer === 'all'
                          ? 'All (Incidents & Units)'
                          : layer === 'incidents'
                          ? '🚨 Incidents (Flashing)'
                          : '🛡️ Friendly Forces'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tactical Map Container */}
              <TacticalMap
                records={copRecords}
                focusedRecordId={mapFocusedId}
                onSelectRecord={(rec) => {
                  if (rec.category === 'incidents') {
                    setSelectedIncidentForBox(rec);
                    setMapFocusedId(rec.id);
                  }
                }}
                isLive={true}
                onRefresh={fetchSupabaseIncidents}
                className="h-[620px] w-full rounded-lg border border-slate-200 shadow-xl"
              />

              {/* Bottom Telemetry Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-sans">
                <div className="p-2.5 rounded bg-white border border-slate-200 text-slate-700">
                  <span className="text-slate-500 block text-[10px]">MGRS INCIDENTS:</span>
                  <span className="text-blue-700 font-bold">{incidents.length} Active Beacons</span>
                </div>
                <div className="p-2.5 rounded bg-white border border-slate-200 text-slate-700">
                  <span className="text-slate-500 block text-[10px]">FRIENDLY UNITS:</span>
                  <span className="text-blue-600 font-bold">{mappedUnits.length} Deployed</span>
                </div>
                <div className="p-2.5 rounded bg-white border border-slate-200 text-slate-700">
                  <span className="text-slate-500 block text-[10px]">SUPABASE SYNC:</span>
                  <span className="text-blue-600 font-bold">Connected // Live</span>
                </div>
                <div className="p-2.5 rounded bg-white border border-slate-200 text-slate-700">
                  <span className="text-slate-500 block text-[10px]">GRID DATUM:</span>
                  <span className="text-blue-600 font-bold">MGRS // WGS-84</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* INCIDENT BOARD */}
          {/* ========================================================================= */}
          {activeNav === 'incident_board' && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <h2 className="text-base font-sans font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                    <span>TOC Incident Triage Board</span>
                  </h2>
                  <p className="text-xs font-sans text-slate-500 mt-0.5">
                    Categorized priority triage and SQL incident table for theater operations
                  </p>
                </div>

                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center p-0.5 rounded-lg bg-slate-50 border border-slate-200 font-sans text-xs">
                    <button
                      onClick={() => setIncidentBoardViewMode('board')}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] uppercase transition-all ${
                        incidentBoardViewMode === 'board'
                          ? 'bg-slate-100 border border-slate-200 text-slate-800 font-bold shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Board</span>
                    </button>
                    <button
                      onClick={() => setIncidentBoardViewMode('table')}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] uppercase transition-all ${
                        incidentBoardViewMode === 'table'
                          ? 'bg-blue-50 border border-blue-200 text-blue-700 font-bold shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>SQL Table</span>
                    </button>
                  </div>

                  {/* Add Events/Incident Button */}
                  <button
                    onClick={() => handleOpenOpRecord(null)}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Events/Incident</span>
                  </button>
                </div>
              </div>

              {/* Conditional: SQL Table or 4-Priority Column Board */}
              {incidentBoardViewMode === 'table' ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 overflow-hidden shadow-sm font-sans">
                  {incidents.length === 0 ? (
                    <div className="p-8 text-center space-y-3">
                      <Activity className="w-8 h-8 text-slate-500 mx-auto" />
                      <div className="text-slate-700 text-sm font-bold">No Incidents in SQL Table</div>
                      <p className="text-slate-500 text-xs max-w-md mx-auto">
                        There are currently no incidents recorded. Click below to add an incident.
                      </p>
                      <button
                        onClick={() => handleOpenOpRecord(null)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Events/Incident</span>
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[600px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 z-10 bg-white border-b border-slate-200">
                          <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                            <th className="py-3 px-3.5 font-bold">Code</th>
                            <th className="py-3 px-3.5 font-bold">Date / DTG</th>
                            <th className="py-3 px-3.5 font-bold">Type</th>
                            <th className="py-3 px-3.5 font-bold">Area / Location</th>
                            <th className="py-3 px-3.5 font-bold">MGRS Grid Ref</th>
                            <th className="py-3 px-3.5 font-bold">Priority</th>
                            <th className="py-3 px-3.5 font-bold">Status</th>
                            <th className="py-3 px-3.5 font-bold max-w-xs">Result / Narrative</th>
                            <th className="py-3 px-3.5 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {incidents.map((inc) => {
                            const priorityColor =
                              inc.priority === 'critical'
                                ? 'bg-rose-950 text-slate-800 border border-rose-800'
                                : inc.priority === 'high'
                                ? 'bg-amber-950 text-slate-800 border border-amber-800'
                                : inc.priority === 'medium'
                                ? 'bg-cyan-950 text-blue-700 border border-cyan-800'
                                : 'bg-slate-900 text-slate-500 border border-slate-800';

                            const statusColor =
                              inc.status === 'active'
                                ? 'bg-emerald-950 text-blue-600 border border-emerald-800'
                                : inc.status === 'pending'
                                ? 'bg-amber-950 text-blue-600 border border-amber-800'
                                : 'bg-slate-900 text-slate-500 border border-slate-800';

                            return (
                              <tr
                                key={inc.id}
                                className="hover:bg-white/60 transition-colors group cursor-default"
                              >
                                <td className="py-3 px-3.5 font-bold text-blue-700 whitespace-nowrap">
                                  <span className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                                    {inc.code}
                                  </span>
                                </td>
                                <td className="py-3 px-3.5 whitespace-nowrap text-slate-700">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    <span>{formatZuluDTG(inc.metadata?.operation_date || inc.created_at)}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3.5 whitespace-nowrap">
                                  <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px]">
                                    {inc.metadata?.operation_type || inc.title.split('—')[0].trim()}
                                  </span>
                                </td>
                                <td className="py-3 px-3.5 whitespace-nowrap text-slate-800">
                                  <div className="flex items-center space-x-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span className="truncate max-w-[150px] font-semibold" title={inc.location_name}>
                                      {inc.location_name || inc.metadata?.area || 'Classified'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-3.5 whitespace-nowrap">
                                  {inc.metadata?.mgrs ? (
                                    <span className="text-slate-800 font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] flex items-center space-x-1 w-fit">
                                      <Compass className="w-3 h-3 text-blue-600" />
                                      <span>{inc.metadata.mgrs}</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 text-xs">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-3.5 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${priorityColor}`}>
                                    {inc.priority}
                                  </span>
                                </td>
                                <td className="py-3 px-3.5 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor}`}>
                                    {inc.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3.5 max-w-xs text-slate-700">
                                  <p
                                    className="line-clamp-2 leading-relaxed text-[11px] text-slate-700"
                                    title={inc.description}
                                  >
                                    {inc.description || 'No narrative logged.'}
                                  </p>
                                </td>
                                <td className="py-3 px-3.5 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end space-x-1.5">
                                    <button
                                      onClick={() => handleOpenOpRecord(inc)}
                                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-blue-700 hover:text-cyan-200 text-xs font-semibold transition-all shadow-sm active:scale-95"
                                      title="Edit Incident Record"
                                    >
                                      <Edit className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteOpRecord(inc)}
                                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:text-slate-800 text-xs font-semibold transition-all shadow-sm active:scale-95"
                                      title="Delete Incident Record"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* 4 Priority Columns */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {(['critical', 'high', 'medium', 'low'] as const).map((priority) => {
                    const priIncidents = incidents.filter((i) => i.priority === priority);
                    const colColor =
                      priority === 'critical'
                        ? 'border-rose-800/80 bg-rose-950/20 text-slate-800'
                        : priority === 'high'
                        ? 'border-amber-800/80 bg-amber-950/20 text-slate-800'
                        : priority === 'medium'
                        ? 'border-cyan-800/80 bg-cyan-950/20 text-blue-700'
                        : 'border-slate-800 bg-slate-900/30 text-slate-700';

                    return (
                      <div key={priority} className="p-3 rounded-lg bg-white border border-slate-200 space-y-2.5">
                        <div className={`flex items-center justify-between p-2 rounded border font-sans text-xs font-bold uppercase ${colColor}`}>
                          <span>{priority}</span>
                          <span>{priIncidents.length}</span>
                        </div>

                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                          {priIncidents.length === 0 ? (
                            <div className="p-4 text-center text-xs font-sans text-slate-500 border border-dashed border-slate-200 rounded">
                              No {priority} incidents
                            </div>
                          ) : (
                            priIncidents.map((inc) => (
                              <div
                                key={inc.id}
                                onClick={() => handleOpenOpRecord(inc)}
                                className="p-3 rounded bg-slate-50 border border-slate-200 hover:border-cyan-500/60 cursor-pointer transition-all space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-sans text-[11px] font-bold text-blue-600">{inc.code}</span>
                                  <span
                                    className={`text-[9px] px-1 py-0.2 rounded font-sans font-bold uppercase ${
                                      inc.status === 'active'
                                        ? 'bg-emerald-950 text-blue-600'
                                        : 'bg-slate-900 text-slate-500'
                                    }`}
                                  >
                                    {inc.status}
                                  </span>
                                </div>
                                <div className="text-xs font-semibold text-slate-800 leading-snug">{inc.title}</div>
                                {inc.metadata?.mgrs && (
                                  <div className="text-[10px] font-sans text-blue-600 flex items-center space-x-1">
                                    <Compass className="w-3 h-3 text-blue-600 shrink-0" />
                                    <span>MGRS: {inc.metadata.mgrs}</span>
                                  </div>
                                )}
                                {inc.location_name && (
                                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                    <span className="truncate">{inc.location_name}</span>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. FRIENDLY-FORCE STATUS */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* 4. FORCES STATUS — Unit Management */}
          {/* ========================================================================= */}
          {activeNav === 'friendly_status' && (
            <div className="space-y-4">

             
                
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-center">
                  <div className="text-[10px] font-sans text-slate-500 uppercase">Total Units</div>
                  <div className="text-2xl font-sans font-bold text-blue-600 mt-1">{forceUnits.length}</div>
                  <div className="text-[10px] font-sans text-blue-700">Registered</div>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-center">
                  <div className="text-[10px] font-sans text-slate-500 uppercase">AFP Officers</div>
                  <div className="text-2xl font-sans font-bold text-blue-600 mt-1">
                    {forceUnits.reduce((s, u) => s + (u.afp_officers || 0), 0)}
                  </div>
                  <div className="text-[10px] font-sans text-slate-700">Total</div>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-center">
                  <div className="text-[10px] font-sans text-slate-500 uppercase">AFP Enlisted</div>
                  <div className="text-2xl font-sans font-bold text-blue-600 mt-1">
                    {forceUnits.reduce((s, u) => s + (u.afp_enlisted || 0), 0)}
                  </div>
                  <div className="text-[10px] font-sans text-slate-800">Total</div>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-center">
                  <div className="text-[10px] font-sans text-slate-500 uppercase">Total Assets</div>
                  <div className="text-2xl font-sans font-bold text-blue-700 mt-1">
                    {forceUnits.reduce((s, u) => s + (u.wavs_tavs||0)+(u.air_assets||0)+(u.vehicle||0)+(u.naval_assets||0)+(u.isr_asset||0)+(u.artillery_asset||0), 0)}
                  </div>
                  <div className="text-[10px] font-sans text-slate-800">Combined</div>
                </div>
              </div>

              {/* Units Table */}
              <div className="rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
                <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-sans font-bold text-slate-800 uppercase">Tactical Unit Roster</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-blue-50 text-blue-700 border border-blue-200">{forceUnits.length} Units</span>
                  </div>
                  <button
                    onClick={() => { setEditingForceUnit(null); setIsForceModalOpen(true); }}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold transition-all shadow-sm active:scale-95 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Unit</span>
                  </button>
                </div>
                {forceUnits.length === 0 ? (
                  <div className="p-12 text-center font-sans space-y-3">
                    <Shield className="w-10 h-10 text-slate-600 mx-auto" />
                    <div className="text-slate-700 text-sm font-bold">No Units Registered</div>
                    <p className="text-slate-500 text-xs">Click &quot;Add Unit&quot; to register your first tactical unit.</p>
                    <button
                      onClick={() => { setEditingForceUnit(null); setIsForceModalOpen(true); }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Unit</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-3 font-bold whitespace-nowrap">Battalion</th>
                          <th className="py-3 px-3 font-bold whitespace-nowrap">Brigade</th>
                          <th className="py-3 px-3 font-bold whitespace-nowrap">Province</th>
                          <th className="py-3 px-3 font-bold whitespace-nowrap text-blue-600">MGRS Grid</th>
                          <th className="py-3 px-3 font-bold text-right whitespace-nowrap">Officers</th>
                          <th className="py-3 px-3 font-bold text-right whitespace-nowrap">Enlisted</th>
                          <th className="py-3 px-3 font-bold text-right whitespace-nowrap">CAA</th>
                          <th className="py-3 px-3 font-bold text-right whitespace-nowrap">WAVs/TAVs</th>
                          <th className="py-3 px-3 font-bold text-right whitespace-nowrap">Air</th>
                          <th className="py-3 px-3 font-bold text-right whitespace-nowrap">Vehicle</th>
                          <th className="py-3 px-3 font-bold text-right whitespace-nowrap">Naval</th>
                          <th className="py-3 px-3 font-bold text-right whitespace-nowrap">ISR</th>
                          <th className="py-3 px-3 font-bold text-right whitespace-nowrap">Artillery</th>
                          <th className="py-3 px-3 font-bold text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {forceUnits.map((unit) => {
                          const unitMgrs = unit.mgrs || (unit.area && PRESET_AREA_COORDS[unit.area] ? toMGRS(PRESET_AREA_COORDS[unit.area][0], PRESET_AREA_COORDS[unit.area][1]) : '—');
                          return (
                            <tr key={unit.id} className="hover:bg-slate-100 transition-colors">
                              <td className="py-3 px-3 font-bold text-blue-700 whitespace-nowrap">
                              <div className="flex items-center space-x-2.5">
                                {unit.logo_url ? (
                                  <img
                                    src={unit.logo_url}
                                    alt={unit.battalion}
                                    className="w-7 h-7 rounded-md object-contain border border-slate-200 bg-slate-50 p-0.5 shrink-0 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-md border border-slate-200 bg-slate-50/80 flex items-center justify-center text-slate-600 shrink-0">
                                    <Shield className="w-3.5 h-3.5 text-cyan-500/70" />
                                  </div>
                                )}
                                <span>{unit.battalion}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-800 whitespace-nowrap">{unit.brigade}</td>
                            <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{unit.area || '—'}</td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-sans tracking-wider font-semibold">
                                {unitMgrs}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-blue-600">{unit.afp_officers}</td>
                            <td className="py-3 px-3 text-right font-bold text-slate-700">{unit.afp_enlisted}</td>
                            <td className="py-3 px-3 text-right text-slate-700">{unit.caa}</td>
                            <td className="py-3 px-3 text-right text-slate-800">{unit.wavs_tavs}</td>
                            <td className="py-3 px-3 text-right text-sky-300">{unit.air_assets}</td>
                            <td className="py-3 px-3 text-right text-slate-700">{unit.vehicle}</td>
                            <td className="py-3 px-3 text-right text-blue-300">{unit.naval_assets}</td>
                            <td className="py-3 px-3 text-right text-slate-700">{unit.isr_asset}</td>
                            <td className="py-3 px-3 text-right text-slate-800">{unit.artillery_asset}</td>
                            <td className="py-3 px-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => { setEditingForceUnit(unit); setIsForceModalOpen(true); }}
                                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-blue-700 text-[11px] font-semibold transition-all active:scale-95"
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteForceUnit(unit.id)}
                                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-semibold transition-all active:scale-95"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                        })}
                      </tbody>
                      {/* Totals row */}
                      <tfoot>
                        <tr className="bg-slate-50 border-t-2 border-slate-200 text-[11px] font-bold">
                          <td className="py-3 px-3 text-slate-700 uppercase tracking-wider" colSpan={4}>TOTALS</td>
                          <td className="py-3 px-3 text-right text-blue-600">{forceUnits.reduce((s,u)=>s+(u.afp_officers||0),0)}</td>
                          <td className="py-3 px-3 text-right text-slate-700">{forceUnits.reduce((s,u)=>s+(u.afp_enlisted||0),0)}</td>
                          <td className="py-3 px-3 text-right text-slate-700">{forceUnits.reduce((s,u)=>s+(u.caa||0),0)}</td>
                          <td className="py-3 px-3 text-right text-slate-800">{forceUnits.reduce((s,u)=>s+(u.wavs_tavs||0),0)}</td>
                          <td className="py-3 px-3 text-right text-sky-300">{forceUnits.reduce((s,u)=>s+(u.air_assets||0),0)}</td>
                          <td className="py-3 px-3 text-right text-slate-700">{forceUnits.reduce((s,u)=>s+(u.vehicle||0),0)}</td>
                          <td className="py-3 px-3 text-right text-blue-300">{forceUnits.reduce((s,u)=>s+(u.naval_assets||0),0)}</td>
                          <td className="py-3 px-3 text-right text-slate-700">{forceUnits.reduce((s,u)=>s+(u.isr_asset||0),0)}</td>
                          <td className="py-3 px-3 text-right text-slate-800">{forceUnits.reduce((s,u)=>s+(u.artillery_asset||0),0)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. ONGOING MISSIONS */}
          {/* ========================================================================= */}
          {activeNav === 'ongoing_missions' && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-white border border-slate-200 flex justify-between items-center shadow-md">
                <div>
                  <h2 className="text-base font-sans font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span>Ongoing Tactical Missions</span>
                  </h2>
                  <p className="text-xs font-sans text-slate-500 mt-0.5">
                    Live operational sorties, reconnaissance task orders, and objectives underway
                  </p>
                </div>
                <button
                  onClick={() => onOpenCreate('tasks')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Launch Mission</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectRecord(task)}
                    className="p-4 rounded-lg bg-white/80 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-all space-y-3 shadow-sm group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs font-bold text-blue-600 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                        {task.code}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold uppercase ${
                          task.status === 'active'
                            ? 'bg-emerald-950 text-blue-600 border border-emerald-800'
                            : 'bg-amber-950 text-slate-800 border border-amber-800'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm group-hover:text-slate-800">{task.title}</h4>
                      <p className="text-xs font-sans text-slate-500 mt-1 leading-relaxed">{task.description}</p>
                    </div>

                    {/* Mission Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-sans text-slate-500">
                        <span>MISSION COMPLETION</span>
                        <span className="text-slate-800 font-bold">{idx % 2 === 0 ? '75%' : '45%'}</span>
                      </div>
                      <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all"
                          style={{ width: idx % 2 === 0 ? '75%' : '45%' }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-sans text-slate-500 pt-2 border-t border-slate-200">
                      <span>Target: {task.location_name || 'Grid Sector Alpha'}</span>
                      <span className="text-blue-600 group-hover:underline">Mission Brief →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. UNIT TASKINGS */}
          {/* ========================================================================= */}
          {activeNav === 'unit_taskings' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <h2 className="text-base font-sans font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                    <span>Unit Taskings & Tactical Directives</span>
                  </h2>
                  <p className="text-xs font-sans text-slate-500 mt-0.5">
                    Order of battle assignments, tactical directives, and status tracking
                  </p>
                </div>
                <button
                  onClick={() => { setEditingTasking(null); setIsTaskingModalOpen(true); }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold transition-all shadow-md active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Unit Tasking</span>
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-center">
                  <div className="text-[10px] font-sans text-slate-500 uppercase">Total Taskings</div>
                  <div className="text-2xl font-sans font-bold text-blue-600 mt-1">{unitTaskings.length}</div>
                  <div className="text-[10px] font-sans text-blue-700">Directives</div>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-center">
                  <div className="text-[10px] font-sans text-slate-500 uppercase">Active Orders</div>
                  <div className="text-2xl font-sans font-bold text-blue-600 mt-1">
                    {unitTaskings.filter((t) => t.status === 'active').length}
                  </div>
                  <div className="text-[10px] font-sans text-slate-700">In Progress</div>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-center">
                  <div className="text-[10px] font-sans text-slate-500 uppercase">Pending Orders</div>
                  <div className="text-2xl font-sans font-bold text-blue-600 mt-1">
                    {unitTaskings.filter((t) => t.status === 'pending').length}
                  </div>
                  <div className="text-[10px] font-sans text-slate-800">Awaiting Acknowledgment</div>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-center">
                  <div className="text-[10px] font-sans text-slate-500 uppercase">Critical Priority</div>
                  <div className="text-2xl font-sans font-bold text-blue-700 mt-1">
                    {unitTaskings.filter((t) => t.priority === 'critical').length}
                  </div>
                  <div className="text-[10px] font-sans text-slate-800">High Urgency</div>
                </div>
              </div>

              {/* Unit Taskings Table */}
              <div className="rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden">
                <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-sans font-bold text-slate-800 uppercase">Assigned Tactical Directives</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-cyan-950 text-blue-600 border border-cyan-800">
                    {unitTaskings.length} Directives
                  </span>
                </div>

                {unitTaskings.length === 0 ? (
                  <div className="p-12 text-center font-sans space-y-3">
                    <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
                    <div className="text-slate-700 text-sm font-bold">No Unit Taskings Recorded</div>
                    <p className="text-slate-500 text-xs">Click &quot;Add Unit Tasking&quot; to assign a tactical directive to a unit.</p>
                    <button
                      onClick={() => { setEditingTasking(null); setIsTaskingModalOpen(true); }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Unit Tasking</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-3 font-bold whitespace-nowrap">Assigned Unit</th>
                          <th className="py-3 px-3 font-bold min-w-[200px]">Directive Details</th>
                          <th className="py-3 px-3 font-bold whitespace-nowrap">Priority / Urgency</th>
                          <th className="py-3 px-3 font-bold whitespace-nowrap">MGRS Grid Ref</th>
                          <th className="py-3 px-3 font-bold whitespace-nowrap">Status</th>
                          <th className="py-3 px-3 font-bold whitespace-nowrap">Date</th>
                          <th className="py-3 px-3 font-bold text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {unitTaskings.map((tsk) => {
                          const priorityBadge =
                            tsk.priority === 'critical'
                              ? 'bg-rose-950 text-slate-800 border-rose-800'
                              : tsk.priority === 'high'
                              ? 'bg-amber-950 text-slate-800 border-amber-800'
                              : tsk.priority === 'medium'
                              ? 'bg-cyan-950 text-blue-700 border-cyan-800'
                              : 'bg-slate-900 text-slate-500 border-slate-700';

                          const statusBadge =
                            tsk.status === 'active'
                              ? 'bg-emerald-950 text-blue-600 border-emerald-800'
                              : tsk.status === 'pending'
                              ? 'bg-amber-950 text-blue-600 border-amber-800'
                              : tsk.status === 'completed'
                              ? 'bg-blue-950 text-blue-400 border-blue-800'
                              : 'bg-slate-900 text-slate-500 border-slate-700';

                          return (
                            <tr key={tsk.id} className="hover:bg-slate-100 transition-colors">
                              <td className="py-3 px-3 font-bold text-blue-700 whitespace-nowrap">
                                <div className="flex items-center space-x-1.5">
                                  <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>{tsk.assigned_unit_label || 'Unassigned'}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-800 min-w-[200px] max-w-xs">
                                <p className="line-clamp-2 leading-relaxed text-[11px]" title={tsk.directive_details}>
                                  {tsk.directive_details}
                                </p>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${priorityBadge}`}>
                                  {tsk.priority}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                {tsk.mgrs ? (
                                  <span className="text-slate-800 font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] flex items-center space-x-1 w-fit">
                                    <Compass className="w-3 h-3 text-blue-600" />
                                    <span>{tsk.mgrs}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-xs">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusBadge}`}>
                                  {tsk.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                                {tsk.task_date || (tsk.created_at ? new Date(tsk.created_at).toLocaleDateString() : '—')}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => { setEditingTasking(tsk); setIsTaskingModalOpen(true); }}
                                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-blue-700 text-[11px] font-semibold transition-all active:scale-95"
                                    title="Edit Unit Tasking"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUnitTasking(tsk.id)}
                                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-semibold transition-all active:scale-95"
                                    title="Delete Unit Tasking"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* ========================================================================= */}
          {/* 8. MOVEMENT / DEPLOYMENT STATUS */}
          {/* ========================================================================= */}
          {activeNav === 'movement_deployment' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <h2 className="text-base font-sans font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span>Movement & Tactical Deployment Status</span>
                  </h2>
                  <p className="text-xs font-sans text-slate-500 mt-0.5">
                    Convoys, troop movements, air/sea transits, and tactical logistics tracking
                  </p>
                </div>
                <button
                  onClick={() => { setEditingMovement(null); setIsMovementModalOpen(true); }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold transition-all shadow-md active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Movement</span>
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500 uppercase">Total Movements</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">{movementDeployments.length}</div>
                  <div className="text-[10px] text-blue-700">Registered Deployments</div>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500 uppercase">In Transit / Active</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {movementDeployments.filter((m) => m.status === 'in_transit' || m.status === 'active').length}
                  </div>
                  <div className="text-[10px] text-slate-800">En Route</div>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500 uppercase">Air Sorties</div>
                  <div className="text-2xl font-bold text-sky-400 mt-1">
                    {movementDeployments.filter((m) => m.mode_of_movement === 'Air').length}
                  </div>
                  <div className="text-[10px] text-sky-300">Air Mobility</div>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500 uppercase">Land & Sea Convoys</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {movementDeployments.filter((m) => m.mode_of_movement === 'Land' || m.mode_of_movement === 'Sea').length}
                  </div>
                  <div className="text-[10px] text-slate-700">Ground / Naval</div>
                </div>
              </div>

              {/* Movements Table */}
              <div className="rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden font-sans">
                <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase">Deployment & Transit Ledger</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-blue-600 border border-cyan-800">
                    {movementDeployments.length} Movements
                  </span>
                </div>

                {movementDeployments.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <Truck className="w-10 h-10 text-slate-600 mx-auto" />
                    <div className="text-slate-700 text-sm font-bold">No Movement Records Found</div>
                    <p className="text-slate-500 text-xs max-w-md mx-auto">
                      Click &quot;Add Movement&quot; to log tactical personnel deployment, convoy transit, or air/naval mobility.
                    </p>
                    <button
                      onClick={() => { setEditingMovement(null); setIsMovementModalOpen(true); }}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Movement</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-3 font-bold whitespace-nowrap">Unit / People</th>
                          <th className="py-3 px-3 font-bold whitespace-nowrap">Mode</th>
                          <th className="py-3 px-3 font-bold min-w-[200px]">Transit Route</th>
                          <th className="py-3 px-3 font-bold min-w-[180px]">Directive Details</th>
                          <th className="py-3 px-3 font-bold whitespace-nowrap">Priority</th>
                          <th className="py-3 px-3 font-bold whitespace-nowrap">Status</th>
                          <th className="py-3 px-3 font-bold whitespace-nowrap">Date</th>
                          <th className="py-3 px-3 font-bold text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {movementDeployments.map((move) => {
                          const priorityBadge =
                            move.priority === 'critical'
                              ? 'bg-rose-950 text-slate-800 border-rose-800'
                              : move.priority === 'high'
                              ? 'bg-amber-950 text-slate-800 border-amber-800'
                              : move.priority === 'medium'
                              ? 'bg-cyan-950 text-blue-700 border-cyan-800'
                              : 'bg-slate-900 text-slate-500 border-slate-700';

                          const statusBadge =
                            move.status === 'in_transit'
                              ? 'bg-amber-950 text-slate-800 border-amber-800'
                              : move.status === 'active'
                              ? 'bg-emerald-950 text-blue-600 border-emerald-800'
                              : move.status === 'completed'
                              ? 'bg-blue-950 text-blue-400 border-blue-800'
                              : move.status === 'cancelled'
                              ? 'bg-rose-950 text-blue-700 border-rose-900'
                              : 'bg-slate-900 text-slate-500 border-slate-700';

                          const ModeRowIcon =
                            move.mode_of_movement === 'Air'
                              ? Plane
                              : move.mode_of_movement === 'Sea'
                              ? Anchor
                              : Truck;

                          const modeBadge =
                            move.mode_of_movement === 'Air'
                              ? 'bg-sky-950 text-sky-300 border-sky-800'
                              : move.mode_of_movement === 'Sea'
                              ? 'bg-cyan-950 text-blue-700 border-cyan-800'
                              : 'bg-amber-950 text-slate-800 border-amber-800';

                          return (
                            <tr key={move.id} className="hover:bg-slate-100 transition-colors">
                              <td className="py-3 px-3 font-bold text-blue-700 whitespace-nowrap">
                                <div className="flex items-center space-x-1.5">
                                  <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>{move.unit_people}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border ${modeBadge}`}>
                                  <ModeRowIcon className="w-3 h-3" />
                                  <span>{move.mode_of_movement}</span>
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-800">
                                <div className="flex items-center space-x-1.5 text-[11px]">
                                  <span className="text-slate-700 font-medium">{move.location_from}</span>
                                  <span className="text-blue-600 font-bold">➔</span>
                                  <span className="text-blue-600 font-semibold">{move.location_to}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-800 max-w-xs">
                                <p className="line-clamp-2 leading-relaxed text-[11px]" title={move.directive_details}>
                                  {move.directive_details}
                                </p>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${priorityBadge}`}>
                                  {move.priority}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusBadge}`}>
                                  {move.status === 'in_transit' ? 'In Transit' : move.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                                {move.movement_date || (move.created_at ? new Date(move.created_at).toLocaleDateString() : '—')}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => { setEditingMovement(move); setIsMovementModalOpen(true); }}
                                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-blue-700 text-[11px] font-semibold transition-all active:scale-95"
                                    title="Edit Movement Record"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMovement(move.id)}
                                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-semibold transition-all active:scale-95"
                                    title="Delete Movement Record"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tactical Transit Corridors Reference Card */}
             
            </div>
          )}


          {/* ========================================================================= */}
          {/* 11. SPOTREP (TACTICAL SPOT REPORTS) */}
          {/* ========================================================================= */}
          {activeNav === 'spotrep' && (
            (() => {
              const displayedSpotReports = spotReports.filter((r) => {
                if (!spotReportSearch.trim()) return true;
                const q = spotReportSearch.toLowerCase();
                return (
                  (r.event && r.event.toLowerCase().includes(q)) ||
                  (r.location && r.location.toLowerCase().includes(q)) ||
                  (r.unit_involved && r.unit_involved.toLowerCase().includes(q)) ||
                  (r.narrative && r.narrative.toLowerCase().includes(q)) ||
                  (r.results && r.results.toLowerCase().includes(q)) ||
                  (r.file_name && r.file_name.toLowerCase().includes(q))
                );
              });

              return (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md font-sans">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                        <FileWarning className="w-5 h-5 text-blue-700" />
                        <span>Operational Cell // Spot Reports (SPOTREP)</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Rapid transmission of critical field intelligence, encounters, results, and attached evidence files
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingSpotReport(null);
                        setIsSpotReportModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Spot Report</span>
                    </button>
                  </div>

                  {/* Summary Stats Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-sans">
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Total Spot Reports</div>
                      <div className="text-xl font-bold text-slate-900 mt-0.5">{spotReports.length}</div>
                      <div className="text-[10px] text-slate-500">Transmitted &amp; Saved</div>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="text-[10px] text-blue-700 uppercase font-bold flex items-center space-x-1">
                        <Paperclip className="w-3 h-3" />
                        <span>Attached Files</span>
                      </div>
                      <div className="text-xl font-bold text-slate-800 mt-0.5">
                        {spotReports.filter((r) => Boolean(r.file_name)).length}
                      </div>
                      <div className="text-[10px] text-slate-500">Documents / Media Logged</div>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="text-[10px] text-blue-600 uppercase font-bold flex items-center space-x-1">
                        <Shield className="w-3 h-3" />
                        <span>Units Involved</span>
                      </div>
                      <div className="text-xl font-bold text-blue-700 mt-0.5">
                        {new Set(spotReports.map((r) => r.unit_involved).filter(Boolean)).size}
                      </div>
                      <div className="text-[10px] text-slate-500">Distinct forces committed</div>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="text-[10px] text-blue-600 uppercase font-bold">Latest Incident</div>
                      <div className="text-xs font-bold text-slate-800 mt-1 truncate" title={spotReports[0]?.event || 'None'}>
                        {spotReports[0]?.event || 'No reports logged'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {spotReports[0]?.location || 'Awaiting field transmission'}
                      </div>
                    </div>
                  </div>

                  {/* Search and Filters Strip */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-sans">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={spotReportSearch}
                        onChange={(e) => setSpotReportSearch(e.target.value)}
                        placeholder="Search by event, location, unit, narrative, results, or file..."
                        className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-sans focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-slate-600"
                      />
                      {spotReportSearch && (
                        <button
                          onClick={() => setSpotReportSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-2">
                      <span>Showing <strong className="text-slate-800">{displayedSpotReports.length}</strong> of {spotReports.length} reports</span>
                    </div>
                  </div>

                  {/* SPOTREPs Table */}
                  <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-lg font-sans">
                    {displayedSpotReports.length === 0 ? (
                      <div className="p-10 text-center space-y-3">
                        <FileWarning className="w-10 h-10 text-slate-600 mx-auto" />
                        <div className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                          {spotReports.length === 0 ? 'No Spot Reports Filed' : 'No Matching Reports Found'}
                        </div>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          {spotReports.length === 0
                            ? 'Capture urgent field events, fleeting contact intelligence, results, and attached evidence files.'
                            : 'Try adjusting your search criteria.'}
                        </p>
                        {spotReports.length === 0 && (
                          <button
                            onClick={() => {
                              setEditingSpotReport(null);
                              setIsSpotReportModalOpen(true);
                            }}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add First Spot Report</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                              <th className="py-3 px-3">Event</th>
                              <th className="py-3 px-3">Date of Incident</th>
                              <th className="py-3 px-3">Location</th>
                              <th className="py-3 px-3">Unit Involved</th>
                              <th className="py-3 px-3 min-w-[200px]">Narrative</th>
                              <th className="py-3 px-3 min-w-[150px]">Results</th>
                              <th className="py-3 px-3">Attached File</th>
                              <th className="py-3 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-sans">
                            {displayedSpotReports.map((report) => (
                              <tr key={report.id} className="hover:bg-slate-100 transition-colors">
                                <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                    <span>{report.event}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-slate-700 whitespace-nowrap text-[11px]">
                                  <div className="flex items-center space-x-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                    <span>{report.incident_date}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-blue-700 whitespace-nowrap">
                                  <div className="flex items-center space-x-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span>{report.location}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-slate-800 whitespace-nowrap">
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 border border-slate-200 text-blue-700">
                                    <Shield className="w-3 h-3 text-blue-600 shrink-0" />
                                    <span>{report.unit_involved}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-slate-800">
                                  <p className="line-clamp-2 leading-relaxed text-[11px] max-w-xs" title={report.narrative}>
                                    {report.narrative}
                                  </p>
                                </td>
                                <td className="py-3 px-3 text-slate-800">
                                  <p className="line-clamp-2 leading-relaxed text-[11px] text-slate-700/90 max-w-xs" title={report.results}>
                                    {report.results}
                                  </p>
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  {report.file_name ? (
                                    report.file_data ? (
                                      <a
                                        href={report.file_data}
                                        download={report.file_name}
                                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-50 hover:bg-rose-950/80 border border-slate-200 hover:border-rose-600 text-slate-800 text-[11px] font-semibold transition-all group shadow-sm"
                                        title={`Download ${report.file_name}`}
                                      >
                                        <Download className="w-3 h-3 text-blue-700 group-hover:scale-110 transition-transform" />
                                        <span className="truncate max-w-[110px]">{report.file_name}</span>
                                        {report.file_size ? (
                                          <span className="text-[9px] text-slate-500">
                                            ({(report.file_size / 1024).toFixed(0)}KB)
                                          </span>
                                        ) : null}
                                      </a>
                                    ) : (
                                      <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700 text-[11px]">
                                        <Paperclip className="w-3 h-3 text-slate-500" />
                                        <span className="truncate max-w-[110px]">{report.file_name}</span>
                                      </div>
                                    )
                                  ) : (
                                    <span className="text-slate-600 text-[11px] italic">No file</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end space-x-1.5">
                                    <button
                                      onClick={() => {
                                        setEditingSpotReport(report);
                                        setIsSpotReportModalOpen(true);
                                      }}
                                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-blue-700 text-[11px] font-semibold transition-all active:scale-95"
                                      title="Edit Spot Report"
                                    >
                                      <Edit className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSpotReport(report.id)}
                                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-semibold transition-all active:scale-95"
                                      title="Delete Spot Report"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}

          {/* ========================================================= */}
          {/* 5. DIRECTIVES VIEW (under REPORTING next to SPOTREP)     */}
          {/* ========================================================= */}
          {activeNav === 'directives' && (
            (() => {
              const displayedDirectives = directives.filter((d) => {
                const q = directiveSearch.trim().toLowerCase();
                const matchesSearch =
                  !q ||
                  d.directive_number.toLowerCase().includes(q) ||
                  d.title.toLowerCase().includes(q) ||
                  d.directive_type.toLowerCase().includes(q) ||
                  d.issuing_authority.toLowerCase().includes(q) ||
                  d.target_units.toLowerCase().includes(q) ||
                  d.location_aor.toLowerCase().includes(q) ||
                  d.narrative.toLowerCase().includes(q) ||
                  Boolean(d.file_name && d.file_name.toLowerCase().includes(q));

                const matchesType = directiveTypeFilter === 'all' || d.directive_type === directiveTypeFilter;
                const matchesPriority = directivePriorityFilter === 'all' || d.priority === directivePriorityFilter;
                const matchesStatus = directiveStatusFilter === 'all' || d.status === directiveStatusFilter;

                return matchesSearch && matchesType && matchesPriority && matchesStatus;
              });

              return (
                <div className="space-y-4">
                  {/* Directives Header */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-command-900 via-command-900/90 to-command-950 border border-slate-200 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-sans uppercase font-bold tracking-wider">
                          REPORTING // C2 ORDERS
                        </span>
                        <span className="text-[11px] text-slate-500 font-sans">
                          {directives.length} orders recorded
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-1 font-sans tracking-wide flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span>OPERATIONAL DIRECTIVES & TASK ORDERS</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Authoritative command instructions, mission taskings (OPORD, FRAGO, WARNORD, Special Orders), directives and attached annexes.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingDirective(null);
                          setIsDirectiveModalOpen(true);
                        }}
                        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold transition-all shadow-md active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Issue Directive</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Total Directives</div>
                      <div className="text-xl font-bold text-slate-900 mt-0.5">{directives.length}</div>
                      <div className="text-[10px] text-slate-500">All registered task orders</div>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="text-[10px] text-blue-600 uppercase font-bold">Active / In Execution</div>
                      <div className="text-xl font-bold text-blue-600 mt-0.5">
                        {directives.filter((d) => d.status === 'active' || d.status === 'in_execution').length}
                      </div>
                      <div className="text-[10px] text-slate-500">Live operational orders</div>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="text-[10px] text-blue-700 uppercase font-bold">Critical / Flash</div>
                      <div className="text-xl font-bold text-blue-700 mt-0.5">
                        {directives.filter((d) => d.priority === 'critical' || d.priority === 'high').length}
                      </div>
                      <div className="text-[10px] text-slate-500">High priority instructions</div>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="text-[10px] text-blue-600 uppercase font-bold">Signed Annexes / Files</div>
                      <div className="text-xl font-bold text-blue-700 mt-0.5">
                        {directives.filter((d) => Boolean(d.file_name)).length}
                      </div>
                      <div className="text-[10px] text-slate-500">Attached documents</div>
                    </div>
                  </div>

                  {/* Search and Filters Strip */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans">
                    <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={directiveSearch}
                          onChange={(e) => setDirectiveSearch(e.target.value)}
                          placeholder="Search directive ID, title, unit, authority, text..."
                          className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-sans focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-slate-600"
                        />
                        {directiveSearch && (
                          <button
                            onClick={() => setDirectiveSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Filter by Type */}
                      <select
                        value={directiveTypeFilter}
                        onChange={(e) => setDirectiveTypeFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-sans focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="all">All Types</option>
                        <option value="OPORD">OPORD</option>
                        <option value="FRAGO">FRAGO</option>
                        <option value="WARNORD">WARNORD</option>
                        <option value="Command Directive">Command Directive</option>
                        <option value="Special Order">Special Order</option>
                        <option value="ROE">ROE</option>
                      </select>

                      {/* Filter by Priority */}
                      <select
                        value={directivePriorityFilter}
                        onChange={(e) => setDirectivePriorityFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-sans focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="all">All Priorities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="routine">Routine</option>
                      </select>

                      {/* Filter by Status */}
                      <select
                        value={directiveStatusFilter}
                        onChange={(e) => setDirectiveStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-sans focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="in_execution">In Execution</option>
                        <option value="acknowledged">Acknowledged</option>
                        <option value="completed">Completed</option>
                        <option value="superseded">Superseded</option>
                      </select>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center space-x-2">
                      <span>
                        Showing <strong className="text-slate-800">{displayedDirectives.length}</strong> of {directives.length} orders
                      </span>
                    </div>
                  </div>

                  {/* Directives Table */}
                  <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-lg font-sans">
                    {displayedDirectives.length === 0 ? (
                      <div className="p-10 text-center space-y-3">
                        <FileWarning className="w-10 h-10 text-slate-600 mx-auto" />
                        <div className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                          {directives.length === 0 ? 'No Operational Directives Logged' : 'No Matching Directives Found'}
                        </div>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          {directives.length === 0
                            ? 'Issue and coordinate formal tactical directives, operation orders (OPORD), fragmentary orders (FRAGO), and annex documents.'
                            : 'Try adjusting your search query or filter selections.'}
                        </p>
                        {directives.length === 0 && (
                          <button
                            onClick={() => {
                              setEditingDirective(null);
                              setIsDirectiveModalOpen(true);
                            }}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Issue First Directive</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                              <th className="py-3 px-3">Directive / Order ID</th>
                              <th className="py-3 px-3">Type</th>
                              <th className="py-3 px-3 min-w-[200px]">Title & Subject</th>
                              <th className="py-3 px-3">Issuing Authority</th>
                              <th className="py-3 px-3">Target Units</th>
                              <th className="py-3 px-3">Priority</th>
                              <th className="py-3 px-3">Effective Date</th>
                              <th className="py-3 px-3">Location / AOR</th>
                              <th className="py-3 px-3">Annex / File</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {displayedDirectives.map((dir) => {
                              const classificationBadgeColor =
                                dir.classification === 'TOP SECRET'
                                  ? 'bg-rose-950 text-slate-800 border-rose-700'
                                  : dir.classification === 'SECRET'
                                  ? 'bg-red-950 text-red-300 border-red-800'
                                  : dir.classification === 'CONFIDENTIAL'
                                  ? 'bg-amber-950 text-slate-800 border-amber-800'
                                  : dir.classification === 'RESTRICTED'
                                  ? 'bg-blue-950 text-blue-300 border-blue-800'
                                  : 'bg-slate-800 text-slate-700 border-slate-700';

                              const typeBadgeColor =
                                dir.directive_type === 'OPORD'
                                  ? 'bg-purple-950 text-slate-700 border-purple-800'
                                  : dir.directive_type === 'FRAGO'
                                  ? 'bg-cyan-950 text-blue-700 border-cyan-800'
                                  : dir.directive_type === 'WARNORD'
                                  ? 'bg-amber-950 text-slate-800 border-amber-800'
                                  : dir.directive_type === 'Command Directive'
                                  ? 'bg-emerald-950 text-slate-700 border-emerald-800'
                                  : dir.directive_type === 'ROE'
                                  ? 'bg-rose-950 text-slate-800 border-rose-800'
                                  : 'bg-indigo-950 text-indigo-300 border-indigo-800';

                              const statusBadgeColor =
                                dir.status === 'active'
                                  ? 'bg-emerald-950 text-slate-700 border-emerald-800'
                                  : dir.status === 'in_execution'
                                  ? 'bg-cyan-950 text-blue-700 border-cyan-800'
                                  : dir.status === 'acknowledged'
                                  ? 'bg-blue-950 text-blue-300 border-blue-800'
                                  : dir.status === 'completed'
                                  ? 'bg-slate-800 text-slate-500 border-slate-700'
                                  : 'bg-zinc-800 text-zinc-500 border-zinc-700';

                              const priorityBadgeColor =
                                dir.priority === 'critical'
                                  ? 'bg-rose-950 text-slate-800 border-rose-700'
                                  : dir.priority === 'high'
                                  ? 'bg-amber-950 text-slate-800 border-amber-700'
                                  : dir.priority === 'medium'
                                  ? 'bg-blue-950 text-blue-300 border-blue-700'
                                  : 'bg-slate-800 text-slate-700 border-slate-700';

                              return (
                                <tr key={dir.id} className="hover:bg-slate-100 transition-colors">
                                  {/* Directive ID & Classification */}
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                      <span>{dir.directive_number}</span>
                                    </div>
                                    <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded border text-[9px] font-bold ${classificationBadgeColor}`}>
                                      {dir.classification}
                                    </span>
                                  </td>

                                  {/* Type */}
                                  <td className="py-2.5 px-3">
                                    <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${typeBadgeColor}`}>
                                      {dir.directive_type}
                                    </span>
                                  </td>

                                  {/* Title */}
                                  <td className="py-2.5 px-3">
                                    <button
                                      onClick={() => setViewingDirective(dir)}
                                      className="text-left font-bold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1 cursor-pointer"
                                      title="Click to view directive details"
                                    >
                                      {dir.title}
                                    </button>
                                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                      {dir.narrative ? dir.narrative.slice(0, 80) + '...' : 'No narrative'}
                                    </div>
                                  </td>

                                  {/* Issuing Authority */}
                                  <td className="py-2.5 px-3 text-slate-700 text-xs">
                                    {dir.issuing_authority}
                                  </td>

                                  {/* Target Units */}
                                  <td className="py-2.5 px-3 text-slate-700 text-xs">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-cyan-200">
                                      {dir.target_units || 'All Assigned Forces'}
                                    </span>
                                  </td>

                                  {/* Priority */}
                                  <td className="py-2.5 px-3">
                                    <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${priorityBadgeColor}`}>
                                      {dir.priority}
                                    </span>
                                  </td>

                                  {/* Effective Date */}
                                  <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap text-xs">
                                    {dir.effective_date}
                                  </td>

                                  {/* Location / AOR */}
                                  <td className="py-2.5 px-3 text-slate-700 text-xs">
                                    {dir.location_aor || '—'}
                                  </td>

                                  {/* File / Annex */}
                                  <td className="py-2.5 px-3">
                                    {dir.file_name ? (
                                      <a
                                        href={dir.file_data || '#'}
                                        download={dir.file_name}
                                        onClick={(e) => {
                                          if (!dir.file_data) e.preventDefault();
                                        }}
                                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-50 hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-blue-700 text-[10px] font-sans transition-all max-w-[130px] truncate"
                                        title={`Download: ${dir.file_name}`}
                                      >
                                        <Download className="w-3 h-3 flex-shrink-0 text-blue-600" />
                                        <span className="truncate">{dir.file_name}</span>
                                      </a>
                                    ) : (
                                      <span className="text-slate-600 text-[11px]">—</span>
                                    )}
                                  </td>

                                  {/* Status */}
                                  <td className="py-2.5 px-3">
                                    <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${statusBadgeColor}`}>
                                      {dir.status.replace('_', ' ')}
                                    </span>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end space-x-1.5">
                                      <button
                                        onClick={() => setViewingDirective(dir)}
                                        className="flex items-center space-x-1 px-2 py-1 rounded bg-white hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-blue-700 text-[11px] font-semibold transition-all active:scale-95"
                                        title="View Details"
                                      >
                                        <FileText className="w-3 h-3" />
                                        <span>View</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingDirective(dir);
                                          setIsDirectiveModalOpen(true);
                                        }}
                                        className="flex items-center space-x-1 px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-200 text-slate-700 text-[11px] font-semibold transition-all active:scale-95"
                                        title="Edit Directive"
                                      >
                                        <Edit className="w-3 h-3" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteDirective(dir.id)}
                                        className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-semibold transition-all active:scale-95"
                                        title="Delete Directive"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>

      {/* Dedicated Operation Record Modal */}
      <OperationRecordModal
        isOpen={isOpRecordModalOpen}
        onClose={() => {
          setIsOpRecordModalOpen(false);
          setSelectedOpRecord(null);
        }}
        onSave={async (rec) => {
          // Exclusively updates state & cache for the dedicated incidents table (not unified records table)
          const fullRec = rec as RecordItem;
          setSupabaseIncidents((prev) => {
            const isEdit = prev.some((i) => i.id === fullRec.id);
            const updated = isEdit ? prev.map((i) => (i.id === fullRec.id ? fullRec : i)) : [fullRec, ...prev];
            safeLocalStorageSet('operational_incidents', JSON.stringify(updated));
            return updated;
          });
          // Immediately display the table of all added incidents
          setSigactViewMode('table');
          setIsSigactsExpanded(true);
          setIncidentBoardViewMode('table');
        }}
        initialRecord={selectedOpRecord}
      />

      {/* Force Unit Modal */}
      <ForceUnitModal
        isOpen={isForceModalOpen}
        onClose={() => { setIsForceModalOpen(false); setEditingForceUnit(null); }}
        onSave={handleSaveForceUnit}
        editingUnit={editingForceUnit}
      />

      {/* Unit Tasking Modal */}
      <UnitTaskingModal
        isOpen={isTaskingModalOpen}
        onClose={() => {
          setIsTaskingModalOpen(false);
          setEditingTasking(null);
        }}
        onSave={handleSaveUnitTasking}
        editingTasking={editingTasking}
        forceUnits={forceUnits}
        unitOptions={allAvailableUnitOptions}
      />

      {/* Movement & Deployment Modal */}
      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setEditingMovement(null);
        }}
        onSave={handleSaveMovement}
        editingMovement={editingMovement}
        unitSuggestions={unitPeopleSuggestions}
      />

      {/* Spot Report Modal */}
      <SpotReportModal
        isOpen={isSpotReportModalOpen}
        onClose={() => {
          setIsSpotReportModalOpen(false);
          setEditingSpotReport(null);
        }}
        onSave={handleSaveSpotReport}
        editingReport={editingSpotReport}
        unitSuggestions={unitPeopleSuggestions}
      />

      {/* Operational Directive Creation/Edit Modal */}
      <DirectiveModal
        isOpen={isDirectiveModalOpen}
        onClose={() => {
          setIsDirectiveModalOpen(false);
          setEditingDirective(null);
        }}
        onSave={handleSaveDirective}
        editingDirective={editingDirective}
        unitSuggestions={unitPeopleSuggestions}
      />

      {/* Viewing Directive Detail Modal */}
      {viewingDirective && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            {/* Classification banner */}
            <div
              className={`px-4 py-1 text-center text-xs font-bold tracking-widest uppercase border-b ${
                viewingDirective.classification === 'TOP SECRET'
                  ? 'bg-rose-950 text-slate-800 border-rose-800'
                  : viewingDirective.classification === 'SECRET'
                  ? 'bg-red-950 text-red-300 border-red-800'
                  : viewingDirective.classification === 'CONFIDENTIAL'
                  ? 'bg-amber-950 text-slate-800 border-amber-800'
                  : viewingDirective.classification === 'RESTRICTED'
                  ? 'bg-blue-950 text-blue-300 border-blue-800'
                  : 'bg-slate-800 text-slate-700 border-slate-700'
              }`}
            >
              {viewingDirective.classification} // AUTHORIZED HEADQUARTERS DIRECTIVE // LAWFUL ORDER
            </div>

            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/60">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-blue-600 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {viewingDirective.directive_type}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {viewingDirective.directive_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      viewingDirective.status === 'active'
                        ? 'bg-emerald-950 text-slate-700 border-emerald-800'
                        : viewingDirective.status === 'in_execution'
                        ? 'bg-cyan-950 text-blue-700 border-cyan-800'
                        : viewingDirective.status === 'acknowledged'
                        ? 'bg-blue-950 text-blue-300 border-blue-800'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    {viewingDirective.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {viewingDirective.title}
                </h3>
              </div>

              <button
                onClick={() => setViewingDirective(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Key metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Issuing Authority</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingDirective.issuing_authority}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Target Units</div>
                  <div className="font-semibold text-blue-700 mt-0.5">{viewingDirective.target_units || 'All Units'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Effective Date</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingDirective.effective_date}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Priority / Precedence</div>
                  <div
                    className={`font-semibold uppercase mt-0.5 ${
                      viewingDirective.priority === 'critical' ? 'text-blue-700' : 'text-blue-600'
                    }`}
                  >
                    {viewingDirective.priority}
                  </div>
                </div>
              </div>

              {viewingDirective.location_aor && (
                <div className="flex items-center space-x-2 text-slate-700 bg-slate-50/40 p-2.5 rounded-lg border border-slate-200">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold mr-2">Area of Responsibility:</span>
                    <span>{viewingDirective.location_aor}</span>
                  </div>
                </div>
              )}

              {/* Order Narrative / Body */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Directive Narrative / Tactical Orders:</span>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {viewingDirective.narrative || 'No additional narrative provided.'}
                </div>
              </div>

              {/* Attached File Annex Card */}
              {viewingDirective.file_name && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-2 rounded bg-white border border-slate-200 text-blue-600 flex-shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-800 truncate">{viewingDirective.file_name}</div>
                      <div className="text-[10px] text-slate-500">
                        {viewingDirective.file_size ? `${(viewingDirective.file_size / 1024).toFixed(1)} KB` : 'Attached Annex'}
                      </div>
                    </div>
                  </div>
                  {viewingDirective.file_data && (
                    <a
                      href={viewingDirective.file_data}
                      download={viewingDirective.file_name}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md active:scale-95 flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Annex</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <button
                onClick={() => {
                  const text = `[${viewingDirective.classification}] ${viewingDirective.directive_type} - ${viewingDirective.directive_number}\nTITLE: ${viewingDirective.title}\nISSUING: ${viewingDirective.issuing_authority}\nTARGET UNITS: ${viewingDirective.target_units}\nEFFECTIVE: ${viewingDirective.effective_date}\nPRIORITY: ${viewingDirective.priority}\nAOR: ${viewingDirective.location_aor}\n\nNARRATIVE:\n${viewingDirective.narrative}`;
                  navigator.clipboard.writeText(text);
                  alert('Order text copied to clipboard!');
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-all active:scale-95"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Order Text</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const toEdit = viewingDirective;
                    setViewingDirective(null);
                    setEditingDirective(toEdit);
                    setIsDirectiveModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-white hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-blue-700 text-xs font-semibold transition-all active:scale-95"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Directive</span>
                </button>
                <button
                  onClick={() => setViewingDirective(null)}
                  className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

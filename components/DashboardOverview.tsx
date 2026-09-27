'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RecordItem, AuditLog, RecordCategory } from '@/types';
import TacticalMap from './TacticalMap';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { parseMGRSToCoords, toZuluDTG, formatMGRSDisplay, resolveCoordinates } from '@/lib/mgrsUtils';
import {
  Shield,
  Crosshair,
  Flame,
  CheckSquare,
  Square,
  MapPin,
  Layers,
  Users,
  FileText,
  Clock,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface DashboardOverviewProps {
  records: RecordItem[];
  auditLogs?: AuditLog[];
  onSelectRecord: (record: RecordItem) => void;
  onNavigateCategory?: (category: RecordCategory) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
  onRefresh?: () => Promise<void> | void;
}

export default function DashboardOverview({
  records,
  onSelectRecord,
  onNavigateCategory,
  onRefresh,
}: DashboardOverviewProps) {
  // ─── 1. Checklist Tabbings State (Forces Units, PIAGs Locations, Rido, Incidents) ───
  const [layerChecklist, setLayerChecklist] = useState({
    forcesUnits: true,
    piags: true,
    rido: true,
    incidents: true,
  });

  // ─── 2. Dedicated Data State ────────────────────────────────────────────────
  const [forcesUnits, setForcesUnits] = useState<RecordItem[]>([]);
  const [piagLocations, setPiagLocations] = useState<RecordItem[]>([]);
  const [incidentList, setIncidentList] = useState<RecordItem[]>([]);
  const [ridoList, setRidoList] = useState<any[]>([]);

  // Selection & Focus State
  const [selectedIncidentIndex, setSelectedIncidentIndex] = useState(0);
  const [selectedRidoIndex, setSelectedRidoIndex] = useState(0);
  const [focusedRecordId, setFocusedRecordId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── 3. Copy helper ─────────────────────────────────────────────────────────
  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // ─── 4. Initial Cache Hydration from LocalStorage ────────────────────────────
  useEffect(() => {
    try {
      // 1. Force Units
      const cachedUnits = localStorage.getItem('force_units');
      if (cachedUnits) {
        const parsed = JSON.parse(cachedUnits);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: RecordItem[] = parsed.map((u: any) => mapForceUnitToRecord(u));
          setForcesUnits(mapped);
        }
      }

      // 2. PIAGs Locations
      const cachedPiags = localStorage.getItem('cmo_piags_records');
      if (cachedPiags) {
        const parsed = JSON.parse(cachedPiags);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: RecordItem[] = parsed.map((p: any) => mapPiagToRecord(p));
          setPiagLocations(mapped);
        }
      }

      // 3. Operational Incidents
      const cachedIncidents = localStorage.getItem('operational_incidents');
      if (cachedIncidents) {
        const parsed = JSON.parse(cachedIncidents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIncidentList(parsed);
        }
      }

      // 4. Rido Records
      const cachedRido = localStorage.getItem('cmo_rido_records');
      if (cachedRido) {
        const parsed = JSON.parse(cachedRido);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRidoList(parsed);
        }
      }
    } catch (e) {
      console.warn('LocalStorage hydration notice:', e);
    }
  }, []);

  // ─── 5. Mappers to RecordItem ───────────────────────────────────────────────
  const mapForceUnitToRecord = (u: any): RecordItem => {
    let lat = Number(u.lat) || 0;
    let lng = Number(u.lng) || 0;
    const mgrs = u.mgrs || '';

    if (mgrs) {
      const parsed = parseMGRSToCoords(mgrs);
      if (parsed) {
        lat = parsed[0];
        lng = parsed[1];
      }
    }

    return {
      id: u.id || `UNIT-${Math.random()}`,
      code: u.battalion || u.unit_name || 'UNIT',
      title: `${u.battalion || u.unit_name || 'Unit'} (${u.brigade || '6ID'})`,
      category: 'units' as RecordCategory,
      description: `Assigned Mission: ${u.assigned_mission || 'Territorial Security'} | Readiness: ${u.readiness || 'Combat Ready'} | Officers: ${u.afp_officers || 0}, Enlisted: ${u.afp_enlisted || 0}`,
      status: 'active',
      priority: 'medium',
      lat,
      lng,
      location_name: u.current_location || u.area || 'AOR Base',
      metadata: {
        mgrs,
        battalion: u.battalion,
        brigade: u.brigade,
        unit_name: u.unit_name,
        logo_url: u.logo_url,
        readiness: u.readiness,
        area: u.area,
        afp_officers: u.afp_officers,
        afp_enlisted: u.afp_enlisted,
        contact_number: u.contact_number,
      },
      created_at: u.created_at || new Date().toISOString(),
      updated_at: u.updated_at || new Date().toISOString(),
    };
  };

  const mapPiagToRecord = (p: any): RecordItem => {
    let lat = Number(p.lat) || 0;
    let lng = Number(p.lng) || 0;
    const mgrs = p.mgrs || '';

    if (mgrs) {
      const parsed = parseMGRSToCoords(mgrs);
      if (parsed) {
        lat = parsed[0];
        lng = parsed[1];
      }
    }

    const group = p.group_name || 'PIAG Element';
    const loc = p.address || `${p.barangay ? p.barangay + ', ' : ''}${p.municipality || ''}` || 'AOR Location';

    return {
      id: p.id || `PIAG-${Math.random()}`,
      code: `PIAG-${group.slice(0, 10)}`,
      title: group,
      category: 'locations' as RecordCategory,
      description: `Leader: ${p.commander_leader || p.commander || 'Unknown'} | Strength: ${p.estimated_strength || p.strength || 'N/A'} | Firearms: ${p.firearms_inventory || p.total_est_firearms || p.firearms_count || 'N/A'} | Affiliation: ${p.affiliated_politician_faction || p.affiliation || 'Independent'}`,
      status: p.status === 'Active' || p.status === 'active' ? 'active' : 'pending',
      priority: p.threat_level === 'critical' ? 'critical' : p.threat_level === 'high' ? 'high' : 'medium',
      lat,
      lng,
      location_name: loc,
      metadata: {
        is_piag: true,
        cmo_type: 'piag',
        group_name: group,
        leader: p.commander_leader || p.commander,
        strength: p.estimated_strength || p.strength,
        firearms: p.firearms_inventory || p.total_est_firearms || p.firearms_count,
        affiliation: p.affiliated_politician_faction || p.affiliation,
        threat_level: p.threat_level || 'high',
        province: p.province,
        municipality: p.municipality,
        barangay: p.barangay,
        mgrs,
        notes: p.notes || p.remarks,
      },
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || new Date().toISOString(),
    };
  };

  const mapIncidentToRecord = (inc: any): RecordItem => {
    let lat = Number(inc.lat) || 0;
    let lng = Number(inc.lng) || 0;
    const mgrs = inc.mgrs || inc.metadata?.mgrs || '';

    if (mgrs) {
      const parsed = parseMGRSToCoords(mgrs);
      if (parsed) {
        lat = parsed[0];
        lng = parsed[1];
      }
    }

    const title = inc.title || `${inc.operation_type || inc.incident_type || 'Incident'} — ${inc.area || inc.location_name || 'AOR'}`;
    const code = inc.code || inc.incident_number || 'OPS-INC';

    return {
      id: inc.id || `INC-${Math.random()}`,
      code,
      title,
      category: 'incidents' as RecordCategory,
      description: inc.narrative || inc.description || '',
      status: inc.status || 'active',
      priority: inc.severity === 'critical' || inc.priority === 'critical' ? 'critical' : inc.severity === 'high' || inc.priority === 'high' ? 'high' : 'medium',
      lat,
      lng,
      location_name: inc.area || inc.location_name || 'Tactical Sector',
      metadata: {
        mgrs,
        area: inc.area || inc.location_name,
        operation_type: inc.operation_type || inc.incident_type,
        dtg: inc.dtg,
        narrative: inc.narrative || inc.description,
        reporting_unit: inc.reporting_unit,
        casualties: inc.enemy_casualties || inc.friendly_casualties,
        weapons_recovered: inc.weapons_recovered,
        incident_date: inc.incident_date || inc.created_at,
      },
      created_at: inc.created_at || new Date().toISOString(),
      updated_at: inc.updated_at || new Date().toISOString(),
    };
  };

  // ─── 6. Supabase Live Data Fetch ────────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    setIsRefreshing(true);
    try {
      // 1. Force Units
      const { data: unitsData } = await supabase
        .from('force_units')
        .select('*')
        .order('created_at', { ascending: false });

      if (unitsData && unitsData.length > 0) {
        const mappedUnits = unitsData.map(mapForceUnitToRecord);
        setForcesUnits(mappedUnits);
        try {
          localStorage.setItem('force_units', JSON.stringify(unitsData));
        } catch {}
      }

      // 2. PIAGs Locations
      const { data: piagsData } = await supabase
        .from('cmo_piags')
        .select('*')
        .order('created_at', { ascending: false });

      if (piagsData && piagsData.length > 0) {
        const mappedPiags = piagsData.map(mapPiagToRecord);
        setPiagLocations(mappedPiags);
        try {
          localStorage.setItem('cmo_piags_records', JSON.stringify(piagsData));
        } catch {}
      }

      // 3. Incidents
      const { data: incidentsData } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (incidentsData && incidentsData.length > 0) {
        const mappedIncidents = incidentsData.map(mapIncidentToRecord);
        setIncidentList(mappedIncidents);
        try {
          localStorage.setItem('operational_incidents', JSON.stringify(mappedIncidents));
        } catch {}
      }

      // 4. Rido Conflicts
      const { data: ridoData } = await supabase
        .from('cmo_rido')
        .select('*')
        .order('created_at', { ascending: false });

      if (ridoData && ridoData.length > 0) {
        setRidoList(ridoData);
        try {
          localStorage.setItem('cmo_rido_records', JSON.stringify(ridoData));
        } catch {}
      }
    } catch (err) {
      console.warn('Dashboard live data fetch exception:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ─── 7. Fallback Merge with Props.records ────────────────────────────────────
  const effectiveForceUnits = useMemo(() => {
    if (forcesUnits.length > 0) return forcesUnits;
    return records.filter((r) => r.category === 'units');
  }, [forcesUnits, records]);

  const effectivePiags = useMemo(() => {
    if (piagLocations.length > 0) return piagLocations;
    return records
      .filter(
        (r) =>
          r.metadata?.is_piag === true ||
          r.metadata?.cmo_type === 'piag' ||
          (r.code && r.code.startsWith('PIAG-')) ||
          (r.title && r.title.startsWith('[PIAG]'))
      )
      .map((r) => ({
        ...r,
        metadata: {
          ...r.metadata,
          is_piag: true,
          cmo_type: 'piag',
        },
      }));
  }, [piagLocations, records]);

  const effectiveIncidents = useMemo(() => {
    if (incidentList.length > 0) return incidentList;
    return records.filter((r) => r.category === 'incidents');
  }, [incidentList, records]);

  const effectiveRidoList = useMemo(() => {
    if (ridoList.length > 0) return ridoList;
    return records
      .filter((r) => r.metadata?.cmo_type === 'rido')
      .map((r) => ({
        id: r.id,
        case_code: r.code,
        feuding_parties: r.title,
        party_a: r.metadata?.party_a,
        party_b: r.metadata?.party_b,
        status: r.status === 'active' ? 'Active' : 'Under Mediation',
        root_cause: r.metadata?.root_cause || 'Clan Feud',
        municipality: r.metadata?.municipality || r.location_name,
        barangay: r.metadata?.barangay || '',
        mgrs: r.metadata?.mgrs,
        lat: r.lat,
        lng: r.lng,
        mediating_agency: r.metadata?.mediating_agency || '6ID, AFP',
        narrative_history: r.description,
      }));
  }, [ridoList, records]);

  // Active items for right cards
  const latestIncident = effectiveIncidents[selectedIncidentIndex] || effectiveIncidents[0] || null;
  const latestRido = effectiveRidoList[selectedRidoIndex] || effectiveRidoList[0] || null;

  // ─── 8. Convert All Rido Records to RecordItem (for Checklist Layer Plotting) ───
  const effectiveRidoRecords = useMemo((): RecordItem[] => {
    return effectiveRidoList.map((r: any) => {
      let lat = Number(r.lat) || 0;
      let lng = Number(r.lng) || 0;
      const mgrs = r.mgrs || r.party_a_mgrs || r.party_b_mgrs || '';

      if (mgrs) {
        const parsed = parseMGRSToCoords(mgrs);
        if (parsed) {
          lat = parsed[0];
          lng = parsed[1];
        }
      }

      return {
        id: r.id || `RIDO-${Math.random()}`,
        code: r.case_code || 'RIDO-RECORD',
        title: r.feuding_parties || 'Clan Dispute',
        category: 'locations' as RecordCategory,
        description: r.narrative_history || `${r.party_a || 'Party A'} vs ${r.party_b || 'Party B'} — Root Cause: ${r.root_cause || 'Unspecified'}`,
        status: r.status === 'Active' ? 'active' : 'pending',
        priority: 'high',
        lat,
        lng,
        location_name: r.address || `${r.barangay ? r.barangay + ', ' : ''}${r.municipality || 'Conflict Zone'}`,
        metadata: {
          is_rido_party: true,
          cmo_type: 'rido_party',
          clan_name: r.feuding_parties || 'Rido Feud',
          party_a: r.party_a,
          party_b: r.party_b,
          mgrs,
          root_cause: r.root_cause,
          mediating_agency: r.mediating_agency,
          lead_mediator: r.lead_mediator,
        },
        created_at: r.created_at || new Date().toISOString(),
        updated_at: r.updated_at || new Date().toISOString(),
      } as RecordItem;
    });
  }, [effectiveRidoList]);

  // ─── 9. Build Visible Map Records Based on Checklist Tabbings ────────────────
  const visibleMapRecords = useMemo(() => {
    const combined: RecordItem[] = [];

    // 1. Forces Units Layer
    if (layerChecklist.forcesUnits) {
      combined.push(...effectiveForceUnits);
    }

    // 2. PIAGs Locations Layer
    if (layerChecklist.piags) {
      combined.push(...effectivePiags);
    }

    // 3. Rido Layer (next to PIAGs Locations)
    if (layerChecklist.rido) {
      combined.push(...effectiveRidoRecords);
    } else if (focusedRecordId && effectiveRidoRecords.some((r) => r.id === focusedRecordId)) {
      // If user focused a specific Rido while layer is unchecked, still keep focused pin visible
      const focusedRido = effectiveRidoRecords.find((r) => r.id === focusedRecordId);
      if (focusedRido) combined.push(focusedRido);
    }

    // 4. Incidents Layer
    if (layerChecklist.incidents) {
      combined.push(...effectiveIncidents);
    }

    return combined;
  }, [
    layerChecklist,
    effectiveForceUnits,
    effectivePiags,
    effectiveRidoRecords,
    effectiveIncidents,
    focusedRecordId,
  ]);

  // Handle focusing on an item
  const handleFocusRecord = (recordId: string) => {
    setFocusedRecordId(null);
    setTimeout(() => {
      setFocusedRecordId(recordId);
    }, 40);
  };

  const handleFullRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      try {
        await onRefresh();
      } catch {}
    }
    await loadDashboardData();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-4 font-sans text-slate-900">
      {/* ─── Grid: Tactical Map (2 Cols) + Latest Feed (1 Col) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* ─── Left 2 Columns: Upper Horizontal Checklist Tabbings + Tactical Map */}
        <div className="lg:col-span-2 flex flex-col space-y-3">
          {/* Upper Portion: Horizontal Checklist Tabbings (Clean light theme matching OperationCell) */}
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-3">
            {/* Left Header */}
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-sans font-bold text-slate-900 uppercase tracking-wide">
                Tactical Map Layers:
              </span>
            </div>

            {/* Center / Right: Horizontal Checklist Tabbings */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Tab 1: Forces Units */}
              <button
                type="button"
                onClick={() =>
                  setLayerChecklist((prev) => ({
                    ...prev,
                    forcesUnits: !prev.forcesUnits,
                  }))
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans whitespace-nowrap transition-all select-none shrink-0 ${
                  layerChecklist.forcesUnits
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
                title="Toggle Forces Units layer on Tactical Map"
              >
                {layerChecklist.forcesUnits ? (
                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="tracking-wide">Forces Units</span>
                <span
                  className={`text-[10px] font-sans px-1.5 py-0.5 rounded border shrink-0 font-bold ${
                    layerChecklist.forcesUnits
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {effectiveForceUnits.length}
                </span>
              </button>

              {/* Tab 2: PIAGs Locations */}
              <button
                type="button"
                onClick={() =>
                  setLayerChecklist((prev) => ({
                    ...prev,
                    piags: !prev.piags,
                  }))
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans whitespace-nowrap transition-all select-none shrink-0 ${
                  layerChecklist.piags
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
                title="Toggle Private Armed Groups (PIAGs) locations layer on Tactical Map"
              >
                {layerChecklist.piags ? (
                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <Crosshair className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="tracking-wide">PIAGs Locations</span>
                <span
                  className={`text-[10px] font-sans px-1.5 py-0.5 rounded border shrink-0 font-bold ${
                    layerChecklist.piags
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {effectivePiags.length}
                </span>
              </button>

              {/* Tab 3: Rido (Directly next to PIAGs Locations) */}
              <button
                type="button"
                onClick={() =>
                  setLayerChecklist((prev) => ({
                    ...prev,
                    rido: !prev.rido,
                  }))
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans whitespace-nowrap transition-all select-none shrink-0 ${
                  layerChecklist.rido
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
                title="Toggle Rido (Clan Disputes) locations layer on Tactical Map"
              >
                {layerChecklist.rido ? (
                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="tracking-wide">Rido</span>
                <span
                  className={`text-[10px] font-sans px-1.5 py-0.5 rounded border shrink-0 font-bold ${
                    layerChecklist.rido
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {effectiveRidoRecords.length}
                </span>
              </button>

              {/* Tab 4: Incidents */}
              <button
                type="button"
                onClick={() =>
                  setLayerChecklist((prev) => ({
                    ...prev,
                    incidents: !prev.incidents,
                  }))
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans whitespace-nowrap transition-all select-none shrink-0 ${
                  layerChecklist.incidents
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
                title="Toggle Incidents layer on Tactical Map"
              >
                {layerChecklist.incidents ? (
                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="tracking-wide">Incidents</span>
                <span
                  className={`text-[10px] font-sans px-1.5 py-0.5 rounded border shrink-0 font-bold ${
                    layerChecklist.incidents
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {effectiveIncidents.length}
                </span>
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleFullRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
                title="Refresh Map Layers from Database"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tactical Map Container */}
          <div className="relative flex-1 min-h-[580px] rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
            <TacticalMap
              records={visibleMapRecords}
              onSelectRecord={onSelectRecord}
              focusedRecordId={focusedRecordId}
              isLive={true}
              onRefresh={handleFullRefresh}
              className="h-[620px] w-full"
            />
          </div>
        </div>

        {/* ─── Right 1 Column: Latest Incident & Latest Rido ─────────────────── */}
        <div className="lg:col-span-1 flex flex-col space-y-4">
          {/* ─── CARD 1: LATEST INCIDENT ────────────────────────────────────── */}
          <div className="flex-1 rounded-xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col justify-between overflow-hidden hover:border-blue-300 transition-all duration-200">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <h4 className="text-xs font-sans font-bold text-slate-900 uppercase tracking-wide">
                    Latest Incident
                  </h4>
                </div>

                <div className="flex items-center space-x-1.5">
                  {latestIncident && (
                    <span
                      className={`text-[10px] font-sans uppercase px-2 py-0.5 rounded font-bold border ${
                        latestIncident.priority === 'critical'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {latestIncident.priority}
                    </span>
                  )}
                  {latestIncident && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      {latestIncident.code || 'INC'}
                    </span>
                  )}
                </div>
              </div>

              {/* Incident Details */}
              {latestIncident ? (
                <div className="space-y-2.5">
                  {/* Title */}
                  <div>
                    <h5
                      onClick={() => onSelectRecord(latestIncident)}
                      className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors leading-snug line-clamp-2"
                      title={latestIncident.title}
                    >
                      {latestIncident.title}
                    </h5>
                    <div className="text-[11px] text-slate-500 font-sans mt-0.5 flex items-center space-x-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        {latestIncident.metadata?.dtg ||
                          toZuluDTG(latestIncident.metadata?.incident_date || latestIncident.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Location & MGRS */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-start space-x-1.5 text-xs text-slate-700 font-sans">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{latestIncident.location_name || 'AOR Location'}</span>
                    </div>

                    {latestIncident.metadata?.mgrs && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px]">
                        <span className="text-slate-600 font-mono">
                          MGRS: <span className="text-blue-700 font-bold">{formatMGRSDisplay(latestIncident.metadata.mgrs)}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(latestIncident.metadata.mgrs, 'inc-mgrs')}
                          className="text-[10px] text-slate-500 hover:text-blue-600 flex items-center space-x-1"
                          title="Copy MGRS Grid Coordinates"
                        >
                          {copiedText === 'inc-mgrs' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Narrative Brief */}
                  {latestIncident.description && (
                    <div className="text-xs text-slate-600 font-sans line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                      {latestIncident.description}
                    </div>
                  )}

                  {/* Operational Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {latestIncident.metadata?.operation_type && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                        {latestIncident.metadata.operation_type}
                      </span>
                    )}
                    {latestIncident.metadata?.reporting_unit && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                        Unit: {latestIncident.metadata.reporting_unit}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      Status: {latestIncident.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-sans py-8 text-center border border-dashed border-slate-200 rounded-lg">
                  No tactical incidents currently recorded.
                </div>
              )}
            </div>

            {/* Actions & Mini Switcher */}
            {latestIncident && (
              <div className="pt-3 border-t border-slate-200 space-y-2 mt-3">
                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleFocusRecord(latestIncident.id)}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Focus on Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectRecord(latestIncident)}
                    className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-slate-900 text-xs font-sans font-medium transition-all shadow-sm active:scale-95"
                    title="View Full Incident Record"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Details</span>
                  </button>
                </div>

                {/* Switch between recent incidents if more than 1 */}
                {effectiveIncidents.length > 1 && (
                  <div className="flex items-center space-x-1.5 overflow-x-auto pt-1">
                    <span className="text-[10px] text-slate-500 font-sans shrink-0 uppercase font-semibold">
                      Recent:
                    </span>
                    {effectiveIncidents.slice(0, 3).map((inc, idx) => (
                      <button
                        key={inc.id}
                        type="button"
                        onClick={() => {
                          setSelectedIncidentIndex(idx);
                          handleFocusRecord(inc.id);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono shrink-0 transition-all ${
                          selectedIncidentIndex === idx
                            ? 'bg-blue-600 text-white font-bold shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {inc.code || `INC-${idx + 1}`}
                      </button>
                    ))}
                    {onNavigateCategory && (
                      <button
                        type="button"
                        onClick={() => onNavigateCategory('incidents')}
                        className="text-[10px] text-blue-600 hover:underline shrink-0 ml-auto flex items-center font-sans font-semibold"
                      >
                        <span>All</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── CARD 2: LATEST RIDO ────────────────────────────────────────── */}
          <div className="flex-1 rounded-xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col justify-between overflow-hidden hover:border-blue-300 transition-all duration-200">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-sans font-bold text-slate-900 uppercase tracking-wide">
                    Latest Rido
                  </h4>
                </div>

                <div className="flex items-center space-x-1.5">
                  {latestRido && (
                    <span
                      className={`text-[10px] font-sans uppercase px-2 py-0.5 rounded font-bold border ${
                        latestRido.status === 'Active'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : latestRido.status === 'Under Mediation'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {latestRido.status || 'Active'}
                    </span>
                  )}
                  {latestRido && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      {latestRido.case_code || 'RIDO'}
                    </span>
                  )}
                </div>
              </div>

              {/* Rido Details */}
              {latestRido ? (
                <div className="space-y-2.5">
                  {/* Feuding Parties */}
                  <div>
                    <h5
                      onClick={() => {
                        const targetRidoRec = effectiveRidoRecords[selectedRidoIndex] || effectiveRidoRecords[0];
                        if (targetRidoRec) onSelectRecord(targetRidoRec);
                      }}
                      className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors leading-snug line-clamp-2"
                      title={latestRido.feuding_parties}
                    >
                      {latestRido.feuding_parties || 'Clan Conflict Feud'}
                    </h5>
                    <div className="text-[11px] text-slate-500 font-sans mt-0.5 flex items-center space-x-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span className="font-medium text-slate-600">Root Cause: {latestRido.root_cause || 'Land Dispute / Personal Grudge'}</span>
                    </div>
                  </div>

                  {/* Parties Visual Split */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                      <div className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider">
                        Party A
                      </div>
                      <div className="text-slate-900 font-medium truncate text-[11px]">
                        {latestRido.party_a || latestRido.party_a_personalities || 'Party A Clan'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                      <div className="text-[10px] font-mono text-rose-600 font-bold uppercase tracking-wider">
                        Party B
                      </div>
                      <div className="text-slate-900 font-medium truncate text-[11px]">
                        {latestRido.party_b || latestRido.party_b_personalities || 'Party B Clan'}
                      </div>
                    </div>
                  </div>

                  {/* Location & Coordinates */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-start space-x-1.5 text-xs text-slate-700 font-sans">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {latestRido.address ||
                          `${latestRido.barangay ? latestRido.barangay + ', ' : ''}${latestRido.municipality || 'Maguindanao del Sur'}`}
                      </span>
                    </div>

                    {(latestRido.mgrs || latestRido.party_a_mgrs) && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px]">
                        <span className="text-slate-600 font-mono">
                          MGRS: <span className="text-blue-700 font-bold">{formatMGRSDisplay(latestRido.mgrs || latestRido.party_a_mgrs)}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(latestRido.mgrs || latestRido.party_a_mgrs, 'rido-mgrs')}
                          className="text-[10px] text-slate-500 hover:text-blue-600 flex items-center space-x-1"
                          title="Copy MGRS Grid Coordinates"
                        >
                          {copiedText === 'rido-mgrs' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mediation Lead */}
                  {latestRido.mediating_agency && (
                    <div className="text-[11px] text-slate-500 font-sans flex items-center space-x-1.5">
                      <span className="text-slate-400 font-semibold">Mediating Unit:</span>
                      <span className="text-slate-700 font-medium">{latestRido.mediating_agency}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-sans py-8 text-center border border-dashed border-slate-200 rounded-lg">
                  No active Rido records found.
                </div>
              )}
            </div>

            {/* Actions & Mini Switcher */}
            {latestRido && (
              <div className="pt-3 border-t border-slate-200 space-y-2 mt-3">
                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const targetRidoRec = effectiveRidoRecords[selectedRidoIndex] || effectiveRidoRecords[0];
                      if (targetRidoRec) {
                        handleFocusRecord(targetRidoRec.id);
                      }
                    }}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Focus on Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const targetRidoRec = effectiveRidoRecords[selectedRidoIndex] || effectiveRidoRecords[0];
                      if (targetRidoRec) {
                        onSelectRecord(targetRidoRec);
                      }
                    }}
                    className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-slate-900 text-xs font-sans font-medium transition-all shadow-sm active:scale-95"
                    title="View Full Rido Dossier"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Dossier</span>
                  </button>
                </div>

                {/* Switch between recent Rido cases if more than 1 */}
                {effectiveRidoList.length > 1 && (
                  <div className="flex items-center space-x-1.5 overflow-x-auto pt-1">
                    <span className="text-[10px] text-slate-500 font-sans shrink-0 uppercase font-semibold">
                      Cases:
                    </span>
                    {effectiveRidoList.slice(0, 3).map((r, idx) => (
                      <button
                        key={r.id || idx}
                        type="button"
                        onClick={() => {
                          setSelectedRidoIndex(idx);
                          const matchingRec = effectiveRidoRecords[idx];
                          if (matchingRec) handleFocusRecord(matchingRec.id);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono shrink-0 transition-all ${
                          selectedRidoIndex === idx
                            ? 'bg-blue-600 text-white font-bold shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {r.case_code || `RIDO-${idx + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

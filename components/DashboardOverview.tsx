'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RecordItem, AuditLog, RecordCategory } from '@/types';
import TacticalMap from './TacticalMap';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { parseMGRSToCoords, toMGRS, toZuluDTG, formatMGRSDisplay, resolveCoordinates } from '@/lib/mgrsUtils';
import {
  Shield,
  Crosshair,
  AlertTriangle,
  Flame,
  CheckSquare,
  Square,
  MapPin,
  Layers,
  ExternalLink,
  Users,
  Compass,
  FileText,
  Clock,
  Navigation,
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
  // ─── 1. Checklist Tabbings State (Forces Units, PIAGs Locations, Incidents) ───
  const [layerChecklist, setLayerChecklist] = useState({
    forcesUnits: true,
    piags: true,
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
    } else if (lat !== 0 && lng !== 0) {
      // already numeric
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
    } else if (lat !== 0 && lng !== 0) {
      // direct coords
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

  // Active items
  const latestIncident = effectiveIncidents[selectedIncidentIndex] || effectiveIncidents[0] || null;
  const latestRido = effectiveRidoList[selectedRidoIndex] || effectiveRidoList[0] || null;

  // ─── 8. Convert Latest Rido into a Map RecordItem (for Focus & Plot) ─────────
  const latestRidoRecord = useMemo((): RecordItem | null => {
    if (!latestRido) return null;
    let lat = Number(latestRido.lat) || 0;
    let lng = Number(latestRido.lng) || 0;
    const mgrs = latestRido.mgrs || latestRido.party_a_mgrs || latestRido.party_b_mgrs || '';

    if (mgrs) {
      const parsed = parseMGRSToCoords(mgrs);
      if (parsed) {
        lat = parsed[0];
        lng = parsed[1];
      }
    }

    return {
      id: latestRido.id || 'LATEST-RIDO-PIN',
      code: latestRido.case_code || 'RIDO-RECORD',
      title: latestRido.feuding_parties || 'Clan Dispute',
      category: 'locations',
      description: latestRido.narrative_history || `${latestRido.party_a || 'Party A'} vs ${latestRido.party_b || 'Party B'} — Root Cause: ${latestRido.root_cause || 'Unspecified'}`,
      status: latestRido.status === 'Active' ? 'active' : 'pending',
      priority: 'high',
      lat,
      lng,
      location_name: latestRido.address || `${latestRido.barangay ? latestRido.barangay + ', ' : ''}${latestRido.municipality || 'Conflict Zone'}`,
      metadata: {
        is_rido_party: true,
        cmo_type: 'rido_party',
        clan_name: latestRido.feuding_parties || 'Rido Feud',
        party_a: latestRido.party_a,
        party_b: latestRido.party_b,
        mgrs,
        root_cause: latestRido.root_cause,
        mediating_agency: latestRido.mediating_agency,
        lead_mediator: latestRido.lead_mediator,
      },
      created_at: latestRido.created_at || new Date().toISOString(),
      updated_at: latestRido.updated_at || new Date().toISOString(),
    };
  }, [latestRido]);

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

    // 3. Incidents Layer
    if (layerChecklist.incidents) {
      combined.push(...effectiveIncidents);
    }

    // 4. Always include latest Rido pin if focused or available with coordinates
    if (latestRidoRecord && resolveCoordinates(latestRidoRecord)) {
      if (!combined.some((r) => r.id === latestRidoRecord.id)) {
        combined.push(latestRidoRecord);
      }
    }

    return combined;
  }, [
    layerChecklist,
    effectiveForceUnits,
    effectivePiags,
    effectiveIncidents,
    latestRidoRecord,
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
    <div className="space-y-4">
      {/* ─── Grid: Tactical Map (2 Cols) + Latest Feed (1 Col) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* ─── Left 2 Columns: Upper Horizontal Checklist Tabbings + Tactical Map */}
        <div className="lg:col-span-2 flex flex-col space-y-3">
          {/* Upper Portion: Horizontal Checklist Tabbings */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-tactical-card flex flex-wrap items-center justify-between gap-3">
            {/* Left Header / Badge */}
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm shadow-glow-cyan animate-pulse" />
              <div className="flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-sans font-bold text-slate-100 uppercase tracking-wider">
                  Tactical Map Layers:
                </span>
              </div>
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
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-sans font-semibold transition-all duration-200 select-none ${
                  layerChecklist.forcesUnits
                    ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-200 shadow-sm ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 opacity-60'
                }`}
                title="Toggle Forces Units layer on Tactical Map"
              >
                {layerChecklist.forcesUnits ? (
                  <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="tracking-wide">Forces Units</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    layerChecklist.forcesUnits
                      ? 'bg-cyan-900/90 text-cyan-300 border border-cyan-700/60'
                      : 'bg-slate-800 text-slate-400'
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
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-sans font-semibold transition-all duration-200 select-none ${
                  layerChecklist.piags
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-200 shadow-sm ring-1 ring-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 opacity-60'
                }`}
                title="Toggle Private Armed Groups (PIAGs) locations layer on Tactical Map"
              >
                {layerChecklist.piags ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <Crosshair className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="tracking-wide">PIAGs Locations</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    layerChecklist.piags
                      ? 'bg-amber-900/90 text-amber-300 border border-amber-700/60'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {effectivePiags.length}
                </span>
              </button>

              {/* Tab 3: Incidents */}
              <button
                type="button"
                onClick={() =>
                  setLayerChecklist((prev) => ({
                    ...prev,
                    incidents: !prev.incidents,
                  }))
                }
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-sans font-semibold transition-all duration-200 select-none ${
                  layerChecklist.incidents
                    ? 'bg-rose-950/80 border-rose-500/80 text-rose-200 shadow-sm ring-1 ring-rose-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 opacity-60'
                }`}
                title="Toggle Incidents layer on Tactical Map"
              >
                {layerChecklist.incidents ? (
                  <CheckSquare className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="tracking-wide">Incidents</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    layerChecklist.incidents
                      ? 'bg-rose-900/90 text-rose-300 border border-rose-700/60'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {effectiveIncidents.length}
                </span>
              </button>

              {/* Refresh / Layer Status */}
              <button
                type="button"
                onClick={handleFullRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                title="Refresh Map Layers from Database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tactical Map Container */}
          <div className="relative flex-1 min-h-[580px] rounded-xl overflow-hidden border border-slate-800 shadow-tactical-card">
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
          <div className="flex-1 rounded-xl bg-slate-900/95 border border-slate-800 shadow-tactical-card p-4 flex flex-col justify-between overflow-hidden relative group hover:border-rose-500/50 transition-all duration-300">
            {/* Ambient Red Glow in corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/5 rounded-bl-full pointer-events-none" />

            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-red-beacon" />
                  <h4 className="text-xs font-sans font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <span>Latest Incident</span>
                  </h4>
                </div>

                <div className="flex items-center space-x-1.5">
                  {latestIncident && (
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                        latestIncident.priority === 'critical'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      {latestIncident.priority}
                    </span>
                  )}
                  {latestIncident && (
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-semibold">
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
                      className="text-sm font-bold text-slate-100 hover:text-rose-400 cursor-pointer transition-colors leading-snug line-clamp-2"
                      title={latestIncident.title}
                    >
                      {latestIncident.title}
                    </h5>
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5 flex items-center space-x-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>
                        {latestIncident.metadata?.dtg ||
                          toZuluDTG(latestIncident.metadata?.incident_date || latestIncident.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Location & MGRS */}
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <div className="flex items-start space-x-1.5 text-xs text-slate-300 font-sans">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{latestIncident.location_name || 'AOR Location'}</span>
                    </div>

                    {latestIncident.metadata?.mgrs && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                        <span className="text-slate-400 font-mono">
                          MGRS: <span className="text-cyan-300 font-semibold">{formatMGRSDisplay(latestIncident.metadata.mgrs)}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(latestIncident.metadata.mgrs, 'inc-mgrs')}
                          className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center space-x-1"
                          title="Copy MGRS Grid Coordinates"
                        >
                          {copiedText === 'inc-mgrs' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
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
                    <div className="text-xs text-slate-300/90 font-sans line-clamp-3 bg-slate-950/40 p-2 rounded border border-slate-800/50 leading-relaxed">
                      {latestIncident.description}
                    </div>
                  )}

                  {/* Operational Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {latestIncident.metadata?.operation_type && (
                      <span className="px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-900/60 font-medium">
                        {latestIncident.metadata.operation_type}
                      </span>
                    )}
                    {latestIncident.metadata?.reporting_unit && (
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-medium">
                        Unit: {latestIncident.metadata.reporting_unit}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-900/60 font-medium">
                      Status: {latestIncident.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-sans py-8 text-center border border-dashed border-slate-800 rounded-lg">
                  No tactical incidents currently recorded.
                </div>
              )}
            </div>

            {/* Actions & Mini Switcher */}
            {latestIncident && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2 mt-3">
                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleFocusRecord(latestIncident.id)}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 hover:bg-rose-900 hover:border-rose-600 text-xs font-sans font-semibold transition-all shadow-sm"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                    <span>Focus on Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectRecord(latestIncident)}
                    className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-sans font-medium transition-all"
                    title="View Full Incident Record"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
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
                            ? 'bg-rose-900/90 text-rose-200 border border-rose-600 font-bold'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {inc.code || `INC-${idx + 1}`}
                      </button>
                    ))}
                    {onNavigateCategory && (
                      <button
                        type="button"
                        onClick={() => onNavigateCategory('incidents')}
                        className="text-[10px] text-cyan-400 hover:underline shrink-0 ml-auto flex items-center font-sans font-medium"
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
          <div className="flex-1 rounded-xl bg-slate-900/95 border border-slate-800 shadow-tactical-card p-4 flex flex-col justify-between overflow-hidden relative group hover:border-amber-500/50 transition-all duration-300">
            {/* Ambient Amber Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 rounded-bl-full pointer-events-none" />

            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <h4 className="text-xs font-sans font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Latest Rido</span>
                  </h4>
                </div>

                <div className="flex items-center space-x-1.5">
                  {latestRido && (
                    <span
                      className={`text-[10px] font-sans uppercase px-2 py-0.5 rounded font-bold border ${
                        latestRido.status === 'Active'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : latestRido.status === 'Under Mediation'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {latestRido.status || 'Active'}
                    </span>
                  )}
                  {latestRido && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-semibold">
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
                      onClick={() => latestRidoRecord && onSelectRecord(latestRidoRecord)}
                      className="text-sm font-bold text-slate-100 hover:text-amber-400 cursor-pointer transition-colors leading-snug line-clamp-2"
                      title={latestRido.feuding_parties}
                    >
                      {latestRido.feuding_parties || 'Clan Conflict Feud'}
                    </h5>
                    <div className="text-[11px] text-amber-300/90 font-sans mt-0.5 flex items-center space-x-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span className="font-medium">Root Cause: {latestRido.root_cause || 'Land Dispute / Personal Grudge'}</span>
                    </div>
                  </div>

                  {/* Parties Visual Split */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 space-y-0.5">
                      <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                        Party A
                      </div>
                      <div className="text-slate-200 font-medium truncate text-[11px]">
                        {latestRido.party_a || latestRido.party_a_personalities || 'Party A Clan'}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 space-y-0.5">
                      <div className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">
                        Party B
                      </div>
                      <div className="text-slate-200 font-medium truncate text-[11px]">
                        {latestRido.party_b || latestRido.party_b_personalities || 'Party B Clan'}
                      </div>
                    </div>
                  </div>

                  {/* Location & Coordinates */}
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <div className="flex items-start space-x-1.5 text-xs text-slate-300 font-sans">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {latestRido.address ||
                          `${latestRido.barangay ? latestRido.barangay + ', ' : ''}${latestRido.municipality || 'Maguindanao del Sur'}`}
                      </span>
                    </div>

                    {(latestRido.mgrs || latestRido.party_a_mgrs) && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                        <span className="text-slate-400 font-mono">
                          MGRS: <span className="text-amber-300 font-semibold">{formatMGRSDisplay(latestRido.mgrs || latestRido.party_a_mgrs)}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(latestRido.mgrs || latestRido.party_a_mgrs, 'rido-mgrs')}
                          className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center space-x-1"
                          title="Copy MGRS Grid Coordinates"
                        >
                          {copiedText === 'rido-mgrs' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
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
                    <div className="text-[11px] text-slate-400 font-sans flex items-center space-x-1.5">
                      <span className="text-slate-500 font-semibold">Mediating Unit:</span>
                      <span className="text-slate-300 font-medium">{latestRido.mediating_agency}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-sans py-8 text-center border border-dashed border-slate-800 rounded-lg">
                  No active Rido records found.
                </div>
              )}
            </div>

            {/* Actions & Mini Switcher */}
            {latestRido && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2 mt-3">
                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (latestRidoRecord) {
                        handleFocusRecord(latestRidoRecord.id);
                      }
                    }}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-200 hover:bg-amber-900 hover:border-amber-600 text-xs font-sans font-semibold transition-all shadow-sm"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                    <span>Focus on Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (latestRidoRecord) {
                        onSelectRecord(latestRidoRecord);
                      }
                    }}
                    className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-sans font-medium transition-all"
                    title="View Full Rido Dossier"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
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
                          if (r.id) handleFocusRecord(r.id);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono shrink-0 transition-all ${
                          selectedRidoIndex === idx
                            ? 'bg-amber-900/90 text-amber-200 border border-amber-600 font-bold'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
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

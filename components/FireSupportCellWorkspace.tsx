'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RecordItem, RecordCategory } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import TacticalMap, { TacticalLink } from './TacticalMap';
import FireTargetModal, {
  FireTargetRecord,
  TARGET_CATEGORIES,
  TARGET_PRIORITIES,
  TARGET_STATUSES,
} from './FireTargetModal';
import FiresDeploymentModal, {
  FiresDeploymentRecord,
  WEAPON_SYSTEMS,
  DEPLOYMENT_STATUSES,
} from './FiresDeploymentModal';
import FireMissionModal, {
  FireMissionRecord,
  MISSION_TYPES,
  MISSION_STATUSES,
  BDA_RESULTS,
} from './FireMissionModal';
import {
  Flame,
  Target,
  Shield,
  Crosshair,
  MapPin,
  Compass,
  Navigation,
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
  Radio,
  Clock,
  Layers,
  Sparkles,
  ChevronDown,
  Activity,
  Zap,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Code,
  CheckSquare,
} from 'lucide-react';

// ─── INITIAL SEED DATA FOR CENTRAL MINDANAO / JTFC AOR ───────────────────────
export const INITIAL_FIRE_TARGETS: FireTargetRecord[] = [
  {
    id: 'tgt-001-masigay-bunker',
    target_number: 'T-001',
    description: 'BIFF / DI Armed Encampment & Command Bunker',
    category: 'Encampment / Base',
    province: 'Maguindanao del Sur',
    municipality: 'Datu Piang (Dulawan)',
    barangay: 'Masigay',
    purok_sitio: 'Sitio Riverside',
    address: 'Sitio Riverside, Masigay, Datu Piang (Dulawan), Maguindanao del Sur',
    mgrs: '51NXH6659745322',
    lat: 6.9536,
    lng: 124.4756,
    priority: 'Priority 1 (Urgent)',
    status: 'Targeted / Scheduled',
    assigned_battery: 'Alpha Btry, 6th FAB (105mm Howitzer)',
    recommended_munition: 'HE Point Detonating (Fuse Quick)',
    collateral_damage_estimate: 'Low (Open Field / Forest)',
    remarks: 'Active armed group staging point along marsh navigation corridor. ISR confirmed weapon emplacements.',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tgt-002-olandang-mortar',
    target_number: 'T-002',
    description: 'Mortar Firing Pit & Underground Ammo Cache',
    category: 'Mortar Pit / Firing Position',
    province: 'Maguindanao del Sur',
    municipality: 'Nabalawag',
    barangay: 'Brgy Olandang',
    purok_sitio: 'Sitio Bentad',
    address: 'Sitio Bentad, Brgy Olandang, Nabalawag, Maguindanao del Sur',
    mgrs: '51NXH6771379711',
    lat: 7.0515,
    lng: 124.5184,
    priority: 'Priority 1 (Urgent)',
    status: 'Active / Unengaged',
    assigned_battery: 'Bravo Btry, 10th FAB (155mm Soltam)',
    recommended_munition: 'HE Concrete Piercing / Delay',
    collateral_damage_estimate: 'Low (Open Field / Forest)',
    remarks: 'Suspected origin of harassing indirect fire against government checkpoint along highway corridor.',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tgt-003-buayan-riverine',
    target_number: 'T-003',
    description: 'Waterborne Staging Point & Motorized Bancas',
    category: 'Convoy / Staging Route',
    province: 'Maguindanao del Sur',
    municipality: 'Datu Piang (Dulawan)',
    barangay: 'Buayan',
    purok_sitio: 'Sitio Canal',
    address: 'Sitio Canal, Buayan, Datu Piang (Dulawan), Maguindanao del Sur',
    mgrs: '51NXH6490044100',
    lat: 6.942,
    lng: 124.461,
    priority: 'Priority 2 (Planned)',
    status: 'Suppressed',
    assigned_battery: 'Mortar Plt, 33rd IB (81mm Mortar)',
    recommended_munition: 'White Phosphorus Smoke & HE',
    collateral_damage_estimate: 'Moderate (Proximity to Farmland)',
    remarks: 'Disruption fires ordered by ground maneuver commander to deny river crossing.',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tgt-004-liong-perimeter',
    target_number: 'T-004',
    description: 'HVI Sanctuary Perimeter & Defensive Trench Lines',
    category: 'HVI Sanctuary',
    province: 'Maguindanao del Sur',
    municipality: 'Datu Piang (Dulawan)',
    barangay: 'Liong',
    purok_sitio: 'Purok Pag-asa',
    address: 'Purok Pag-asa, Liong, Datu Piang (Dulawan), Maguindanao del Sur',
    mgrs: '51NXH6820042800',
    lat: 6.931,
    lng: 124.491,
    priority: 'Priority 3 (On-Call)',
    status: 'Neutralized',
    assigned_battery: 'Alpha Btry, 6th FAB (105mm Howitzer)',
    recommended_munition: 'HE Variable Time / Airburst',
    collateral_damage_estimate: 'Low (Open Field / Forest)',
    remarks: 'Engaged during combined operations. Ground patrol verified fortified perimeter collapsed.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_FIRES_DEPLOYMENTS: FiresDeploymentRecord[] = [
  {
    id: 'dep-001-6fab-alpha',
    unit_name: 'Alpha Battery, 6th Field Artillery Battalion',
    callsign: 'COBRA-6',
    commander: 'Capt. Jonathan Reyes, PA',
    weapon_type: '105mm M101A1 Towed Howitzer',
    tube_count: 6,
    base_location: 'Camp Siongco Gun Line',
    province: 'Maguindanao del Norte',
    municipality: 'Datu Odin Sinsuat (Dinaig)',
    barangay: 'Awang',
    purok_sitio: 'Artillery Cantonment',
    address: 'Artillery Cantonment, Awang, Datu Odin Sinsuat, Maguindanao del Norte',
    mgrs: '51NXH5410078200',
    lat: 7.164,
    lng: 124.215,
    max_range_km: 11.5,
    min_range_km: 1.5,
    azimuth_coverage: '090° - 270° (Southern Ligawasan Sector)',
    status: 'Ready / In-Battery',
    rounds_he: 340,
    rounds_smoke: 60,
    rounds_illum: 40,
    frequency: 'FM 46.20 MHz (JTFC Fires Net)',
    remarks: 'All 6 tubes laid on primary azimuth. Fire Direction Center online with digital ballistic computer.',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dep-002-10fab-bravo',
    unit_name: 'Bravo Battery, 10th Field Artillery Battalion',
    callsign: 'THUNDER-1',
    commander: 'Capt. Emmanuel Morales, PA',
    weapon_type: '155mm M-71 / Soltam Howitzer',
    tube_count: 4,
    base_location: 'FOB Sultan Kudarat Gun Line',
    province: 'Maguindanao del Norte',
    municipality: 'Sultan Kudarat (Nuling)',
    barangay: 'Pigcalagan',
    purok_sitio: 'Battery Emplacement Area',
    address: 'Pigcalagan, Sultan Kudarat, Maguindanao del Norte',
    mgrs: '51NXH5840089200',
    lat: 7.234,
    lng: 124.262,
    max_range_km: 20.0,
    min_range_km: 3.5,
    azimuth_coverage: '120° - 240° (Deep Fires Sector)',
    status: 'Mission Active / Firing',
    rounds_he: 210,
    rounds_smoke: 35,
    rounds_illum: 30,
    frequency: 'FM 48.50 MHz (Div Arty Net)',
    remarks: 'Engaging priority interdiction targets in Maguindanao del Sur interior. Prime movers standing by.',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dep-003-33ib-mortar',
    unit_name: 'Heavy Mortar Platoon, 33rd Infantry Battalion',
    callsign: 'ANVIL-3',
    commander: '1LT Mark Anthony Cruz, PA',
    weapon_type: '81mm M29 Medium Mortar',
    tube_count: 4,
    base_location: 'FOB Salbu Tactical Position',
    province: 'Maguindanao del Sur',
    municipality: 'Datu Saudi-Ampatuan',
    barangay: 'Salbu',
    purok_sitio: 'FOB Mortar Pit',
    address: 'FOB Mortar Pit, Salbu, Datu Saudi-Ampatuan, Maguindanao del Sur',
    mgrs: '51NXH6450051200',
    lat: 6.985,
    lng: 124.412,
    max_range_km: 5.6,
    min_range_km: 0.8,
    azimuth_coverage: '360° All-Around Defense',
    status: 'Ready / In-Battery',
    rounds_he: 145,
    rounds_smoke: 25,
    rounds_illum: 20,
    frequency: 'FM 51.10 MHz (Bn Tac Net)',
    remarks: 'Emplaced on sandbagged revetments. Direct wire comms with battalion tactical command post.',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dep-004-15sw-cas',
    unit_name: '15th Strike Wing CAS Flight (PAF)',
    callsign: 'FALCON-15',
    commander: 'Maj. Roberto Gomez, PAF',
    weapon_type: 'A-29B Super Tucano CAS',
    tube_count: 2,
    base_location: 'Awang Air Base (Air Alert)',
    province: 'Maguindanao del Norte',
    municipality: 'Datu Odin Sinsuat (Dinaig)',
    barangay: 'Awang',
    purok_sitio: 'Flight Line Revetment',
    address: 'Awang, Datu Odin Sinsuat, Maguindanao del Norte',
    mgrs: '51NXH5380077800',
    lat: 7.162,
    lng: 124.211,
    max_range_km: 35.0,
    min_range_km: 5.0,
    azimuth_coverage: 'Full JTFC Joint AOR Airspace',
    status: 'Ready / In-Battery',
    rounds_he: 8,
    rounds_smoke: 0,
    rounds_illum: 12,
    frequency: 'VHF 123.45 MHz (JTAC Direct)',
    remarks: '2x aircraft on 15-minute strip alert loaded with precision laser-guided and general purpose bombs.',
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_FIRE_MISSIONS: FireMissionRecord[] = [
  {
    id: 'msn-001-suppression',
    mission_code: 'FM-2026-001',
    target_id: 'tgt-001-masigay-bunker',
    target_number: 'T-001',
    target_description: 'BIFF / DI Armed Encampment & Command Bunker',
    target_mgrs: '51NXH6659745322',
    firing_unit_id: 'dep-001-6fab-alpha',
    firing_unit: 'Alpha Battery, 6th FAB (COBRA-6)',
    mission_type: 'Immediate Suppression',
    munition_type: 'HE Point Detonating (Fuse Quick)',
    rounds_ordered: 24,
    rounds_expended: 24,
    observer_callsign: 'SPOTTER-03 (6th Scout Ranger Coy)',
    status: 'Completed / Rounds Expended',
    bda_result: 'Target Suppressed / Forces Dispersed',
    start_time: '2026-09-25T08:15:00+08:00',
    completed_time: '2026-09-25T08:28:00+08:00',
    remarks: 'Observer confirmed direct impact inside perimeter. Enemy automatic fire ceased immediately.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'msn-002-counterbattery',
    mission_code: 'FM-2026-002',
    target_id: 'tgt-002-olandang-mortar',
    target_number: 'T-002',
    target_description: 'Mortar Firing Pit & Underground Ammo Cache',
    target_mgrs: '51NXH6771379711',
    firing_unit_id: 'dep-002-10fab-bravo',
    firing_unit: 'Bravo Battery, 10th FAB (THUNDER-1)',
    mission_type: 'Counter-Battery Fire',
    munition_type: '155mm HE Concrete Piercing / Delay',
    rounds_ordered: 16,
    rounds_expended: 12,
    observer_callsign: 'EAGLE-EYE-01 (Forward Air Controller)',
    status: 'In Progress / Firing',
    bda_result: 'Pending Ground Assessment',
    start_time: '2026-09-25T11:40:00+08:00',
    remarks: 'Counter-battery mission in progress. Adjust fire completed, fire for effect 4 volleys ordered.',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

interface FireSupportCellWorkspaceProps {
  records?: RecordItem[];
  onSelectRecord?: (record: RecordItem) => void;
  onOpenCreate?: (category?: RecordCategory) => void;
  onSaveRecord?: (record: Partial<RecordItem>) => Promise<void> | void;
  onDeleteRecord?: (id: string) => Promise<void> | void;
  onRefreshData?: () => Promise<void> | void;
  dutyOfficer?: string;
  callsign?: string;
}

export type FireSupportTab = 'status' | 'targets' | 'deployment';

export default function FireSupportCellWorkspace({
  records = [],
  onSelectRecord,
  onOpenCreate,
  onSaveRecord,
  onDeleteRecord,
  onRefreshData,
  dutyOfficer = 'Maj. Dennis Miller',
  callsign = 'HAMMER-LEAD',
}: FireSupportCellWorkspaceProps) {
  // ─── TABS STATE ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<FireSupportTab>('status');

  // ─── DATA STATES ────────────────────────────────────────────────────────────
  const [targets, setTargets] = useState<FireTargetRecord[]>(INITIAL_FIRE_TARGETS);
  const [deployments, setDeployments] = useState<FiresDeploymentRecord[]>(INITIAL_FIRES_DEPLOYMENTS);
  const [missions, setMissions] = useState<FireMissionRecord[]>(INITIAL_FIRE_MISSIONS);

  // ─── MAP INTERACTION STATES ────────────────────────────────────────────────
  const [mapCenter, setMapCenter] = useState<[number, number]>([7.05, 124.38]); // Maguindanao Central JTFC AOR
  const [mapZoom, setMapZoom] = useState<number>(10);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(true); // 650px by default
  const [showTargetsOnMap, setShowTargetsOnMap] = useState<boolean>(true);
  const [showBatteriesOnMap, setShowBatteriesOnMap] = useState<boolean>(true);
  const [showTrajectoryArcs, setShowTrajectoryArcs] = useState<boolean>(true);

  // ─── MODAL STATES ──────────────────────────────────────────────────────────
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<FireTargetRecord | null>(null);

  const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState<FiresDeploymentRecord | null>(null);

  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<FireMissionRecord | null>(null);

  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // ─── SEARCH & FILTER STATES ────────────────────────────────────────────────
  const [targetSearch, setTargetSearch] = useState('');
  const [targetCategoryFilter, setTargetCategoryFilter] = useState('all');
  const [targetPriorityFilter, setTargetPriorityFilter] = useState('all');
  const [targetStatusFilter, setTargetStatusFilter] = useState('all');
  const [targetViewMode, setTargetViewMode] = useState<'table' | 'cards'>('cards');

  const [deploySearch, setDeploySearch] = useState('');
  const [deployWeaponFilter, setDeployWeaponFilter] = useState('all');
  const [deployStatusFilter, setDeployStatusFilter] = useState('all');
  const [deployViewMode, setDeployViewMode] = useState<'table' | 'cards'>('cards');

  const [missionSearch, setMissionSearch] = useState('');
  const [missionStatusFilter, setMissionStatusFilter] = useState('all');

  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── LOAD DATA ON MOUNT ────────────────────────────────────────────────────
  useEffect(() => {
    loadAllFiresData();
  }, []);

  const loadAllFiresData = async () => {
    setIsRefreshing(true);

    // 1. Try LocalStorage
    try {
      const localTargets = localStorage.getItem('fires_targets_records');
      if (localTargets) {
        setTargets(JSON.parse(localTargets));
      }
      const localDeploys = localStorage.getItem('fires_deployments_records');
      if (localDeploys) {
        setDeployments(JSON.parse(localDeploys));
      }
      const localMissions = localStorage.getItem('fires_missions_records');
      if (localMissions) {
        setMissions(JSON.parse(localMissions));
      }
    } catch (e) {
      console.warn('LocalStorage fires read error:', e);
    }

    // 2. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const [tgtRes, depRes, msnRes] = await Promise.allSettled([
          supabase.from('fires_targets').select('*').order('created_at', { ascending: false }),
          supabase.from('fires_deployments').select('*').order('created_at', { ascending: false }),
          supabase.from('fires_missions').select('*').order('created_at', { ascending: false }),
        ]);

        if (tgtRes.status === 'fulfilled' && tgtRes.value.data && tgtRes.value.data.length > 0) {
          setTargets(tgtRes.value.data);
          try {
            localStorage.setItem('fires_targets_records', JSON.stringify(tgtRes.value.data));
          } catch {}
        }
        if (depRes.status === 'fulfilled' && depRes.value.data && depRes.value.data.length > 0) {
          setDeployments(depRes.value.data);
          try {
            localStorage.setItem('fires_deployments_records', JSON.stringify(depRes.value.data));
          } catch {}
        }
        if (msnRes.status === 'fulfilled' && msnRes.value.data && msnRes.value.data.length > 0) {
          setMissions(msnRes.value.data);
          try {
            localStorage.setItem('fires_missions_records', JSON.stringify(msnRes.value.data));
          } catch {}
        }
      } catch (err) {
        console.warn('Supabase fires fetch error:', err);
      }
    }

    setIsRefreshing(false);
  };

  // ─── SAVE HANDLERS ─────────────────────────────────────────────────────────
  const handleSaveTarget = async (record: FireTargetRecord) => {
    const existingIndex = targets.findIndex((t) => t.id === record.id);
    let updated: FireTargetRecord[];
    if (existingIndex >= 0) {
      updated = [...targets];
      updated[existingIndex] = record;
    } else {
      updated = [record, ...targets];
    }
    setTargets(updated);
    try {
      localStorage.setItem('fires_targets_records', JSON.stringify(updated));
    } catch {}

    // Supabase sync
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('fires_targets').upsert([record]);
      } catch (err) {
        console.warn('Supabase target save error:', err);
      }
      try {
        // Mirror to main records table
        const mirror: Partial<RecordItem> = {
          id: record.id,
          title: `[Target ${record.target_number}] ${record.description}`,
          code: record.target_number,
          category: 'incidents',
          status: record.status.includes('Neutralized') ? 'closed' : 'active',
          priority: record.priority.includes('Urgent') ? 'critical' : record.priority.includes('Planned') ? 'high' : 'medium',
          location_name: record.address,
          lat: Number(record.lat),
          lng: Number(record.lng),
          metadata: {
            mgrs: record.mgrs,
            cell: 'fire_support_cell',
            target_number: record.target_number,
            category: record.category,
            priority: record.priority,
            assigned_battery: record.assigned_battery,
            collateral: record.collateral_damage_estimate,
            remarks: record.remarks,
          },
          updated_at: new Date().toISOString(),
        };
        await supabase.from('records').upsert([mirror]);
        if (onRefreshData) onRefreshData();
      } catch (recErr) {
        console.warn('Records mirror error:', recErr);
      }
    }
  };

  const handleDeleteTarget = async (id: string) => {
    if (!confirm('Are you sure you want to remove this fire target?')) return;
    const updated = targets.filter((t) => t.id !== id);
    setTargets(updated);
    try {
      localStorage.setItem('fires_targets_records', JSON.stringify(updated));
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('fires_targets').delete().eq('id', id);
        await supabase.from('records').delete().eq('id', id);
        if (onRefreshData) onRefreshData();
      } catch (e) {
        console.warn('Supabase target delete error:', e);
      }
    }
  };

  const handleSaveDeployment = async (record: FiresDeploymentRecord) => {
    const existingIndex = deployments.findIndex((d) => d.id === record.id);
    let updated: FiresDeploymentRecord[];
    if (existingIndex >= 0) {
      updated = [...deployments];
      updated[existingIndex] = record;
    } else {
      updated = [record, ...deployments];
    }
    setDeployments(updated);
    try {
      localStorage.setItem('fires_deployments_records', JSON.stringify(updated));
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('fires_deployments').upsert([record]);
      } catch (err) {
        console.warn('Supabase deployment save error:', err);
      }
      try {
        const mirror: Partial<RecordItem> = {
          id: record.id,
          title: `[${record.callsign}] ${record.unit_name}`,
          code: record.callsign,
          category: 'units',
          status: record.status.includes('Ready') ? 'active' : 'pending',
          priority: 'high',
          location_name: record.address,
          lat: Number(record.lat),
          lng: Number(record.lng),
          metadata: {
            mgrs: record.mgrs,
            cell: 'fire_support_cell',
            weapon_type: record.weapon_type,
            tube_count: record.tube_count,
            max_range_km: record.max_range_km,
            rounds_he: record.rounds_he,
            commander: record.commander,
          },
          updated_at: new Date().toISOString(),
        };
        await supabase.from('records').upsert([mirror]);
        if (onRefreshData) onRefreshData();
      } catch (e) {
        console.warn('Records mirror error:', e);
      }
    }
  };

  const handleDeleteDeployment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this firing battery deployment?')) return;
    const updated = deployments.filter((d) => d.id !== id);
    setDeployments(updated);
    try {
      localStorage.setItem('fires_deployments_records', JSON.stringify(updated));
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('fires_deployments').delete().eq('id', id);
        await supabase.from('records').delete().eq('id', id);
        if (onRefreshData) onRefreshData();
      } catch (e) {
        console.warn('Supabase deployment delete error:', e);
      }
    }
  };

  const handleSaveMission = async (record: FireMissionRecord) => {
    const existingIndex = missions.findIndex((m) => m.id === record.id);
    let updated: FireMissionRecord[];
    if (existingIndex >= 0) {
      updated = [...missions];
      updated[existingIndex] = record;
    } else {
      updated = [record, ...missions];
    }
    setMissions(updated);
    try {
      localStorage.setItem('fires_missions_records', JSON.stringify(updated));
    } catch {}

    // Deduct ammunition if new expended rounds
    if (record.firing_unit_id && record.rounds_expended > 0) {
      const btry = deployments.find((d) => d.id === record.firing_unit_id);
      if (btry) {
        const updatedBtry = {
          ...btry,
          rounds_he: Math.max(0, btry.rounds_he - record.rounds_expended),
        };
        handleSaveDeployment(updatedBtry);
      }
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('fires_missions').upsert([record]);
      } catch (err) {
        console.warn('Supabase mission save error:', err);
      }
    }
  };

  const handleDeleteMission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fire mission log?')) return;
    const updated = missions.filter((m) => m.id !== id);
    setMissions(updated);
    try {
      localStorage.setItem('fires_missions_records', JSON.stringify(updated));
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('fires_missions').delete().eq('id', id);
      } catch (e) {}
    }
  };

  // ─── TACTICAL MAP RECORDS GENERATOR ─────────────────────────────────────────
  const tacticalMapRecords = useMemo(() => {
    const list: RecordItem[] = [];

    // 1. Target Records
    if (showTargetsOnMap) {
      targets.forEach((tgt) => {
        if (!tgt.lat || !tgt.lng) return;
        list.push({
          id: tgt.id,
          title: `[Target ${tgt.target_number}] ${tgt.description}`,
          description: `${tgt.category} • Priority: ${tgt.priority} • CDE: ${tgt.collateral_damage_estimate || 'N/A'} • Assigned: ${tgt.assigned_battery || 'Unassigned'}`,
          category: 'incidents',
          status: tgt.status.includes('Neutralized') ? 'closed' : tgt.status.includes('Suppressed') ? 'pending' : 'active',
          priority: tgt.priority.includes('Urgent') ? 'critical' : tgt.priority.includes('Planned') ? 'high' : 'medium',
          location_name: tgt.address,
          lat: Number(tgt.lat),
          lng: Number(tgt.lng),
          code: tgt.target_number,
          metadata: {
            mgrs: tgt.mgrs,
            source: 'Fire Support Cell (JFCC)',
            type: 'Fire Target',
            target_number: tgt.target_number,
            status: tgt.status,
            priority: tgt.priority,
            category: tgt.category,
            assigned_battery: tgt.assigned_battery,
            recommended_munition: tgt.recommended_munition,
            collateral_damage: tgt.collateral_damage_estimate,
            remarks: tgt.remarks,
          },
          created_at: tgt.created_at || new Date().toISOString(),
          updated_at: tgt.updated_at || new Date().toISOString(),
        });
      });
    }

    // 2. Battery Deployment Records
    if (showBatteriesOnMap) {
      deployments.forEach((dep) => {
        if (!dep.lat || !dep.lng) return;
        list.push({
          id: dep.id,
          title: `[${dep.callsign}] ${dep.unit_name}`,
          description: `${dep.weapon_type} (${dep.tube_count} Tubes) • Max Range: ${dep.max_range_km} km • HE: ${dep.rounds_he} rnds • Freq: ${dep.frequency}`,
          category: 'units',
          status: dep.status.includes('Ready') ? 'active' : 'pending',
          priority: 'high',
          location_name: dep.address,
          lat: Number(dep.lat),
          lng: Number(dep.lng),
          code: dep.callsign,
          metadata: {
            mgrs: dep.mgrs,
            source: 'Fire Support Cell (Gun Line)',
            type: 'Firing Battery',
            unit_name: dep.unit_name,
            callsign: dep.callsign,
            commander: dep.commander,
            weapon_type: dep.weapon_type,
            tube_count: dep.tube_count,
            max_range_km: dep.max_range_km,
            rounds_he: dep.rounds_he,
            rounds_smoke: dep.rounds_smoke,
            rounds_illum: dep.rounds_illum,
            frequency: dep.frequency,
            status: dep.status,
            remarks: dep.remarks,
          },
          created_at: dep.created_at || new Date().toISOString(),
          updated_at: dep.updated_at || new Date().toISOString(),
        });
      });
    }

    return list;
  }, [targets, deployments, showTargetsOnMap, showBatteriesOnMap]);

  // ─── TACTICAL TRAJECTORY LINKS ───────────────────────────────────────────────
  const tacticalLinks = useMemo(() => {
    if (!showTrajectoryArcs) return [];
    const links: TacticalLink[] = [];

    // For every active mission or target with assigned battery, connect them!
    missions.forEach((msn) => {
      const tgt = targets.find((t) => t.id === msn.target_id || t.target_number === msn.target_number);
      const btry = deployments.find((d) => d.id === msn.firing_unit_id || msn.firing_unit.includes(d.callsign) || msn.firing_unit.includes(d.unit_name));

      if (tgt && btry && tgt.lat && tgt.lng && btry.lat && btry.lng) {
        const isFiring = msn.status === 'In Progress / Firing';
        links.push({
          id: `link-msn-${msn.id}`,
          from: [Number(btry.lat), Number(btry.lng)],
          to: [Number(tgt.lat), Number(tgt.lng)],
          label: `${msn.mission_code}: ${msn.mission_type}`,
          badgeText: isFiring ? 'HOT TRAJECTORY' : 'FIRE MISSION',
          color: isFiring ? '#ef4444' : '#f59e0b',
          dashArray: isFiring ? '4, 4' : '6, 6',
          weight: isFiring ? 3 : 2,
          opacity: 0.85,
        });
      }
    });

    // Also connect targets with assigned batteries if not already covered
    targets.forEach((tgt) => {
      if (!tgt.assigned_battery || tgt.status.includes('Neutralized')) return;
      const btry = deployments.find((d) => tgt.assigned_battery?.includes(d.unit_name) || tgt.assigned_battery?.includes(d.callsign));
      if (btry && tgt.lat && tgt.lng && btry.lat && btry.lng) {
        const alreadyLinked = links.some((l) => l.to[0] === Number(tgt.lat) && l.to[1] === Number(tgt.lng));
        if (!alreadyLinked) {
          links.push({
            id: `link-tgt-${tgt.id}`,
            from: [Number(btry.lat), Number(btry.lng)],
            to: [Number(tgt.lat), Number(tgt.lng)],
            label: `Assigned: ${tgt.target_number}`,
            badgeText: 'BALLISTIC SECTOR',
            color: '#3b82f6',
            dashArray: '5, 8',
            weight: 2,
            opacity: 0.65,
          });
        }
      }
    });

    return links;
  }, [missions, targets, deployments, showTrajectoryArcs]);

  // ─── FILTERED TARGETS ───────────────────────────────────────────────────────
  const filteredTargets = useMemo(() => {
    return targets.filter((tgt) => {
      if (targetCategoryFilter !== 'all' && tgt.category !== targetCategoryFilter) return false;
      if (targetPriorityFilter !== 'all' && tgt.priority !== targetPriorityFilter) return false;
      if (targetStatusFilter !== 'all' && tgt.status !== targetStatusFilter) return false;
      if (targetSearch.trim()) {
        const q = targetSearch.toLowerCase();
        const match =
          tgt.target_number.toLowerCase().includes(q) ||
          tgt.description.toLowerCase().includes(q) ||
          tgt.mgrs.toLowerCase().includes(q) ||
          tgt.address.toLowerCase().includes(q) ||
          (tgt.assigned_battery && tgt.assigned_battery.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [targets, targetCategoryFilter, targetPriorityFilter, targetStatusFilter, targetSearch]);

  // ─── FILTERED DEPLOYMENTS ───────────────────────────────────────────────────
  const filteredDeployments = useMemo(() => {
    return deployments.filter((dep) => {
      if (deployWeaponFilter !== 'all' && dep.weapon_type !== deployWeaponFilter) return false;
      if (deployStatusFilter !== 'all' && dep.status !== deployStatusFilter) return false;
      if (deploySearch.trim()) {
        const q = deploySearch.toLowerCase();
        const match =
          dep.unit_name.toLowerCase().includes(q) ||
          dep.callsign.toLowerCase().includes(q) ||
          dep.weapon_type.toLowerCase().includes(q) ||
          dep.commander.toLowerCase().includes(q) ||
          dep.mgrs.toLowerCase().includes(q) ||
          dep.address.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [deployments, deployWeaponFilter, deployStatusFilter, deploySearch]);

  // ─── FILTERED MISSIONS ──────────────────────────────────────────────────────
  const filteredMissions = useMemo(() => {
    return missions.filter((msn) => {
      if (missionStatusFilter !== 'all' && msn.status !== missionStatusFilter) return false;
      if (missionSearch.trim()) {
        const q = missionSearch.toLowerCase();
        const match =
          msn.mission_code.toLowerCase().includes(q) ||
          msn.target_number.toLowerCase().includes(q) ||
          msn.target_description.toLowerCase().includes(q) ||
          msn.firing_unit.toLowerCase().includes(q) ||
          msn.observer_callsign.toLowerCase().includes(q) ||
          msn.mission_type.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [missions, missionStatusFilter, missionSearch]);

  // ─── KPI METRICS ────────────────────────────────────────────────────────────
  const firesKpi = useMemo(() => {
    const totalTargets = targets.length;
    const activeTargets = targets.filter((t) => t.status === 'Active / Unengaged' || t.status === 'Targeted / Scheduled').length;
    const neutralizedTargets = targets.filter((t) => t.status === 'Neutralized').length;
    const totalTubes = deployments.reduce((acc, d) => acc + (d.tube_count || 0), 0);
    const activeMissions = missions.filter((m) => m.status === 'In Progress / Firing').length;
    const totalRoundsExpended = missions.reduce((acc, m) => acc + (m.rounds_expended || 0), 0);
    const totalReadyHe = deployments.reduce((acc, d) => acc + (d.rounds_he || 0), 0);
    const totalReadySmk = deployments.reduce((acc, d) => acc + (d.rounds_smoke || 0), 0);
    const totalReadyIllum = deployments.reduce((acc, d) => acc + (d.rounds_illum || 0), 0);

    return {
      totalTargets,
      activeTargets,
      neutralizedTargets,
      totalTubes,
      activeMissions,
      totalRoundsExpended,
      totalReadyHe,
      totalReadySmk,
      totalReadyIllum,
    };
  }, [targets, deployments, missions]);

  // List of available battery names for Target modal
  const batteryNames = useMemo(() => {
    return deployments.map((d) => `${d.unit_name} (${d.callsign})`);
  }, [deployments]);

  // Helper status badge styles
  const getTargetStatusBadge = (status: FireTargetRecord['status']) => {
    switch (status) {
      case 'Active / Unengaged':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      case 'Targeted / Scheduled':
        return 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
      case 'Suppressed':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'Neutralized':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getDeploymentStatusBadge = (status: FiresDeploymentRecord['status']) => {
    switch (status) {
      case 'Mission Active / Firing':
        return 'bg-red-100 text-red-800 border-red-300 animate-pulse font-bold';
      case 'Ready / In-Battery':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      case 'Displacing / Road March':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Maintenance / Standby':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const sqlSetupScript = `-- =========================================================================
-- FIRE SUPPORT CELL (JFCC) SUPABASE TABLES SETUP SCRIPT
-- Paste and run this script into your Supabase SQL Editor
-- =========================================================================

-- 1. Fire Targets Table
CREATE TABLE IF NOT EXISTS public.fires_targets (
  id TEXT PRIMARY KEY,
  target_number TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  province TEXT NOT NULL,
  municipality TEXT NOT NULL,
  barangay TEXT NOT NULL,
  purok_sitio TEXT,
  address TEXT NOT NULL,
  mgrs TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_battery TEXT,
  recommended_munition TEXT,
  collateral_damage_estimate TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Fires Deployments (Batteries / Units) Table
CREATE TABLE IF NOT EXISTS public.fires_deployments (
  id TEXT PRIMARY KEY,
  unit_name TEXT NOT NULL,
  callsign TEXT NOT NULL,
  commander TEXT NOT NULL,
  weapon_type TEXT NOT NULL,
  tube_count INTEGER DEFAULT 4,
  base_location TEXT NOT NULL,
  province TEXT NOT NULL,
  municipality TEXT NOT NULL,
  barangay TEXT NOT NULL,
  purok_sitio TEXT,
  address TEXT NOT NULL,
  mgrs TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  max_range_km DOUBLE PRECISION NOT NULL,
  min_range_km DOUBLE PRECISION NOT NULL,
  azimuth_coverage TEXT,
  status TEXT NOT NULL,
  rounds_he INTEGER DEFAULT 0,
  rounds_smoke INTEGER DEFAULT 0,
  rounds_illum INTEGER DEFAULT 0,
  frequency TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Fire Missions Log Table
CREATE TABLE IF NOT EXISTS public.fires_missions (
  id TEXT PRIMARY KEY,
  mission_code TEXT NOT NULL,
  target_id TEXT,
  target_number TEXT NOT NULL,
  target_description TEXT NOT NULL,
  target_mgrs TEXT NOT NULL,
  firing_unit_id TEXT,
  firing_unit TEXT NOT NULL,
  mission_type TEXT NOT NULL,
  munition_type TEXT NOT NULL,
  rounds_ordered INTEGER DEFAULT 12,
  rounds_expended INTEGER DEFAULT 0,
  observer_callsign TEXT NOT NULL,
  status TEXT NOT NULL,
  bda_result TEXT,
  start_time TEXT NOT NULL,
  completed_time TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and permissive policy for authenticated/anon operations
ALTER TABLE public.fires_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fires_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fires_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all fires_targets operations" ON public.fires_targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all fires_deployments operations" ON public.fires_deployments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all fires_missions operations" ON public.fires_missions FOR ALL USING (true) WITH CHECK (true);
`;

  return (
    <div className="space-y-4 font-sans text-slate-900 pb-16">
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── HEADER BANNER ───────────────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white shadow-md border border-rose-900/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-rose-600/90 text-white shadow-sm flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 inline mr-1" />
                <span>FS // FIRES CELL</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block mr-1" />
                <span>HOT CELL ACTIVE</span>
              </span>
              <span className="text-xs text-rose-200/70 font-mono">
                NET: FSCC-DIV-PRIMARY (FM 46.20)
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>Joint Fire Support Cell &amp; Strike Workshop</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Tactical fire direction, indirect artillery coordination, close air support (CAS) deconfliction,
              and designated target trajectory tracking for the Joint Task Force Central (JTFC) Area of Operations.
            </p>
          </div>

          {/* Duty Officer & Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* Duty Officer & Callsign Card */}
            <div className="bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 backdrop-blur-sm text-xs space-y-0.5">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Fires Coordinator
              </div>
              <div className="font-bold text-white flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>{dutyOfficer}</span>
              </div>
              <div className="text-[10px] font-mono text-rose-300">
                CALLSIGN: <span className="font-bold text-white">{callsign}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingMission(null);
                  setIsMissionModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                title="Log or Initiate New Fire Mission"
              >
                <Flame className="w-4 h-4" />
                <span>New Fire Mission</span>
              </button>

              <button
                onClick={() => {
                  setEditingTarget(null);
                  setIsTargetModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all active:scale-95"
                title="Add New Target to Deck"
              >
                <Target className="w-4 h-4 text-rose-600" />
                <span>Add Target</span>
              </button>

              <button
                onClick={() => {
                  setEditingDeployment(null);
                  setIsDeploymentModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-white/10 shadow-sm transition-all"
                title="Deploy New Firing Battery"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Deploy Unit</span>
              </button>

              <button
                onClick={() => setIsSqlModalOpen(true)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors"
                title="View Supabase SQL Schema Setup"
              >
                <Code className="w-4 h-4" />
              </button>

              <button
                onClick={loadAllFiresData}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors"
                title="Sync and Refresh Fires Data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── TACTICAL GEOSPATIAL MAP RADAR (DISPLAY THE TACTICAL MAP) ────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Map Header Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 shadow-sm">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Joint Fires Tactical Geospatial Display
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {tacticalMapRecords.length} Elements Plotted
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Batteries, target locations, impact footprints &amp; ballistic trajectory lines in Central Mindanao AOR.
              </p>
            </div>
          </div>

          {/* Map Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Layer toggles */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs shadow-sm">
              <button
                onClick={() => setShowTargetsOnMap(!showTargetsOnMap)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  showTargetsOnMap
                    ? 'bg-rose-50 text-rose-700 font-bold'
                    : 'text-slate-400 hover:text-slate-600 line-through'
                }`}
                title="Toggle Target Pins"
              >
                Targets ({targets.length})
              </button>
              <button
                onClick={() => setShowBatteriesOnMap(!showBatteriesOnMap)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  showBatteriesOnMap
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-400 hover:text-slate-600 line-through'
                }`}
                title="Toggle Battery Emplacements"
              >
                Batteries ({deployments.length})
              </button>
              <button
                onClick={() => setShowTrajectoryArcs(!showTrajectoryArcs)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  showTrajectoryArcs
                    ? 'bg-amber-50 text-amber-700 font-bold'
                    : 'text-slate-400 hover:text-slate-600 line-through'
                }`}
                title="Toggle Ballistic Trajectory Arcs"
              >
                Arcs ({tacticalLinks.length})
              </button>
            </div>

            {/* Reset AOR button */}
            <button
              onClick={() => {
                setMapCenter([7.05, 124.38]);
                setMapZoom(10);
                setFocusedId(null);
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-sm transition-colors"
              title="Reset Map to Central JTFC AOR"
            >
              <Navigation className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset AOR</span>
            </button>

            {/* Height Toggle (380px vs 650px) */}
            <button
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-sm transition-colors"
              title={isMapExpanded ? 'Collapse Map Height to 380px' : 'Expand Map Height to 650px'}
            >
              {isMapExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isMapExpanded ? '650px' : '380px'}</span>
            </button>
          </div>
        </div>

        {/* Map Display Container */}
        <div className="relative isolate z-0">
          <TacticalMap
            records={tacticalMapRecords}
            onSelectRecord={(rec) => {
              setFocusedId(rec.id);
              if (onSelectRecord) onSelectRecord(rec);
            }}
            center={mapCenter}
            zoom={mapZoom}
            focusedRecordId={focusedId}
            className={`${isMapExpanded ? 'h-[650px]' : 'h-[380px]'} w-full`}
            isLive={true}
            onRefresh={loadAllFiresData}
            customLinks={tacticalLinks}
          />

          {/* Tactical Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-1.5 shadow-md flex items-center space-x-3 text-[11px] text-slate-700 font-medium max-w-[90%] overflow-x-auto">
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-sm" />
              <span className="font-semibold text-rose-700">Target Deck ({targets.length})</span>
            </div>
            <div className="h-3 w-px bg-slate-200 shrink-0" />
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm" />
              <span className="font-semibold text-blue-700">Artillery / Mortars ({deployments.length})</span>
            </div>
            <div className="h-3 w-px bg-slate-200 shrink-0" />
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="w-3 h-0.5 bg-red-600 inline-block border-b border-dashed border-red-500" />
              <span className="font-semibold text-amber-700">Trajectory Arc</span>
            </div>
            <div className="h-3 w-px bg-slate-200 shrink-0" />
            <div className="flex items-center space-x-1 shrink-0 text-slate-500">
              <span>Ready Tubes:</span>
              <span className="font-bold text-slate-800">{firesKpi.totalTubes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── HORIZONTAL TABBINGS (3 TABS) ────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white rounded-xl shadow-sm p-1.5 flex flex-wrap items-center gap-1.5">
        {/* TAB 1: Fire Support Status */}
        <button
          onClick={() => setActiveTab('status')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'status'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Fire Support Status</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'status' ? 'bg-rose-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {firesKpi.activeMissions} Active
          </span>
        </button>

        {/* TAB 2: Targets */}
        <button
          onClick={() => setActiveTab('targets')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'targets'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Targets</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'targets' ? 'bg-rose-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {targets.length}
          </span>
        </button>

        {/* TAB 3: Fires Deployment */}
        <button
          onClick={() => setActiveTab('deployment')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'deployment'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Fires Deployment</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'deployment' ? 'bg-rose-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {deployments.length} Units ({firesKpi.totalTubes} Tubes)
          </span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB CONTENT 1: FIRE SUPPORT STATUS ──────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          {/* 4 Stat Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Active Fire Missions
              </div>
              <div className="text-2xl font-black text-rose-600 mt-1 flex items-center space-x-2">
                <span>{firesKpi.activeMissions}</span>
                {firesKpi.activeMissions > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {missions.length} total logged missions
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Gun Line Readiness
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {firesKpi.totalTubes} Tubes
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Across {deployments.length} deployed batteries &amp; CAS
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Target Deck Status
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {firesKpi.activeTargets} / {firesKpi.totalTargets}
              </div>
              <div className="text-xs text-emerald-600 mt-0.5 font-medium">
                {firesKpi.neutralizedTargets} targets neutralized
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Ready Ammunition Stock
              </div>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {firesKpi.totalReadyHe} HE
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                +{firesKpi.totalReadySmk} Smoke, +{firesKpi.totalReadyIllum} Illum
              </div>
            </div>
          </div>

          {/* Airspace & Safety Deconfliction Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Airspace &amp; Ground Safety Deconfliction Status
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                DECONFLICTION VERIFIED
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-amber-950">
              <div className="p-2.5 rounded-lg bg-white/70 border border-amber-200/60">
                <span className="font-bold block text-slate-800">Restrictive Fire Line (RFL)</span>
                <span className="text-slate-600">Active along Pulangi River / Ligawasan Marsh boundary. Coordinated with 6ID G3.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/70 border border-amber-200/60">
                <span className="font-bold block text-slate-800">Airspace Coordination Area (ACA)</span>
                <span className="text-slate-600">FL080 to FL180 reserved for CAS flights FALCON-15. Artillery high-angle deconflicted.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/70 border border-amber-200/60">
                <span className="font-bold block text-slate-800">No Fire Areas (NFA)</span>
                <span className="text-slate-600">Hospital zones in Datu Piang Poblacion &amp; evacuation centers marked with 500m buffer.</span>
              </div>
            </div>
          </div>

          {/* Active Fire Missions Log Table */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Fire Missions Log &amp; Trajectory Execution
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Live kinetic missions, rounds expended, observer feedback &amp; BDA assessments.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search missions..."
                    value={missionSearch}
                    onChange={(e) => setMissionSearch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <select
                  value={missionStatusFilter}
                  onChange={(e) => setMissionStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  {MISSION_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setEditingMission(null);
                    setIsMissionModalOpen(true);
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Mission</span>
                </button>
              </div>
            </div>

            {/* Missions List */}
            {filteredMissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No fire missions found matching criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500">
                      <th className="py-2 px-3">Mission Code</th>
                      <th className="py-2 px-3">Target / Grid</th>
                      <th className="py-2 px-3">Firing Battery</th>
                      <th className="py-2 px-3">Type &amp; Munition</th>
                      <th className="py-2 px-3 text-center">Rounds Expended</th>
                      <th className="py-2 px-3">Observer</th>
                      <th className="py-2 px-3">Status / BDA</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMissions.map((msn) => (
                      <tr key={msn.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-700 whitespace-nowrap">
                          {msn.mission_code}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{msn.target_number}: {msn.target_description}</div>
                          <div className="text-[10px] font-mono text-slate-500">{msn.target_mgrs}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800">{msn.firing_unit}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-900">{msn.mission_type}</div>
                          <div className="text-[10px] text-slate-500">{msn.munition_type}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-800">
                            {msn.rounds_expended} / {msn.rounds_ordered}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                          {msn.observer_callsign}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                              msn.status.includes('Firing')
                                ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                                : msn.status.includes('Completed')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {msn.status}
                          </span>
                          {msn.bda_result && (
                            <div className="text-[10px] font-semibold text-slate-600 mt-0.5">
                              BDA: {msn.bda_result}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => {
                                setEditingMission(msn);
                                setIsMissionModalOpen(true);
                              }}
                              className="p-1 rounded hover:bg-slate-100 text-slate-600"
                              title="Edit Mission"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMission(msn.id)}
                              className="p-1 rounded hover:bg-rose-50 text-rose-600"
                              title="Delete Mission"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB CONTENT 2: TARGETS ──────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'targets' && (
        <div className="space-y-4">
          {/* Target Filters & Action Bar */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search targets by #, description, MGRS, municipality..."
                  value={targetSearch}
                  onChange={(e) => setTargetSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              <select
                value={targetCategoryFilter}
                onChange={(e) => setTargetCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {TARGET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={targetPriorityFilter}
                onChange={(e) => setTargetPriorityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">All Priorities</option>
                {TARGET_PRIORITIES.map((pri) => (
                  <option key={pri} value={pri}>
                    {pri}
                  </option>
                ))}
              </select>

              <select
                value={targetStatusFilter}
                onChange={(e) => setTargetStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                {TARGET_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              {/* View Switcher */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                <button
                  onClick={() => setTargetViewMode('cards')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                    targetViewMode === 'cards'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
                <button
                  onClick={() => setTargetViewMode('table')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                    targetViewMode === 'table'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingTarget(null);
                setIsTargetModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Target</span>
            </button>
          </div>

          {/* Cards View vs Table View */}
          {targetViewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTargets.map((tgt) => (
                <div
                  key={tgt.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-300 shadow-sm space-y-3 transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-rose-700 text-sm">
                        {tgt.target_number}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {tgt.category}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${getTargetStatusBadge(tgt.status)}`}>
                      {tgt.status}
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {tgt.description}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {tgt.remarks || 'No additional intelligence remarks provided.'}
                    </p>
                  </div>

                  {/* Location & Coordinates */}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">{tgt.address}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="font-mono text-slate-600">
                        MGRS: <span className="font-bold text-slate-900">{tgt.mgrs}</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-100 text-rose-800">
                        {tgt.priority}
                      </span>
                    </div>
                  </div>

                  {/* Assigned battery & Munition */}
                  <div className="text-xs space-y-0.5 text-slate-600">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Assigned: </span>
                      <span className="font-semibold text-slate-800">{tgt.assigned_battery || 'Unassigned / On-Call'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Munition: </span>
                      <span className="text-slate-700">{tgt.recommended_munition || 'Standard HE'}</span>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setMapCenter([tgt.lat, tgt.lng]);
                        setMapZoom(13);
                        setFocusedId(tgt.id);
                      }}
                      className="flex items-center space-x-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Focus on Map</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingTarget(tgt);
                          setIsTargetModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                        title="Edit Target"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTarget(tgt.id)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200"
                        title="Delete Target"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500">
                    <th className="py-2.5 px-3">Target #</th>
                    <th className="py-2.5 px-3">Description &amp; Category</th>
                    <th className="py-2.5 px-3">MGRS &amp; Location</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Assigned Battery</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTargets.map((tgt) => (
                    <tr key={tgt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-700 whitespace-nowrap">
                        {tgt.target_number}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{tgt.description}</div>
                        <div className="text-[10px] text-slate-500">{tgt.category}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-semibold text-slate-800">{tgt.mgrs}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">{tgt.address}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          {tgt.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                        {tgt.assigned_battery || 'Unassigned'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${getTargetStatusBadge(tgt.status)}`}>
                          {tgt.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setMapCenter([tgt.lat, tgt.lng]);
                              setMapZoom(13);
                              setFocusedId(tgt.id);
                            }}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600"
                            title="Focus on Map"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTarget(tgt);
                              setIsTargetModalOpen(true);
                            }}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600"
                            title="Edit Target"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTarget(tgt.id)}
                            className="p-1 rounded hover:bg-rose-50 text-rose-600"
                            title="Delete Target"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB CONTENT 3: FIRES DEPLOYMENT ─────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'deployment' && (
        <div className="space-y-4">
          {/* Deployment Filters & Action Bar */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search gun lines by unit, callsign, commander, weapon..."
                  value={deploySearch}
                  onChange={(e) => setDeploySearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              <select
                value={deployWeaponFilter}
                onChange={(e) => setDeployWeaponFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">All Weapon Calibers</option>
                {WEAPON_SYSTEMS.map((wpn) => (
                  <option key={wpn} value={wpn}>
                    {wpn}
                  </option>
                ))}
              </select>

              <select
                value={deployStatusFilter}
                onChange={(e) => setDeployStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">All Readiness Statuses</option>
                {DEPLOYMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              {/* View Switcher */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                <button
                  onClick={() => setDeployViewMode('cards')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                    deployViewMode === 'cards'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
                <button
                  onClick={() => setDeployViewMode('table')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                    deployViewMode === 'table'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingDeployment(null);
                setIsDeploymentModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Deploy Unit</span>
            </button>
          </div>

          {/* Cards View vs Table View */}
          {deployViewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredDeployments.map((dep) => (
                <div
                  key={dep.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 shadow-sm space-y-3 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                        {dep.callsign}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {dep.weapon_type}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${getDeploymentStatusBadge(dep.status)}`}>
                      {dep.status}
                    </span>
                  </div>

                  {/* Unit Name & Commander */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {dep.unit_name}
                    </h4>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Battery Commander: <span className="font-semibold text-slate-700">{dep.commander}</span>
                    </div>
                  </div>

                  {/* Gun Line Specs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Tube Strength</span>
                      <div className="font-bold text-slate-900">{dep.tube_count} Tubes Emplaced</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Max Range</span>
                      <div className="font-bold text-slate-900">{dep.max_range_km} km ({dep.min_range_km} km min)</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Fires Net</span>
                      <div className="font-mono font-semibold text-slate-800 truncate">{dep.frequency}</div>
                    </div>
                  </div>

                  {/* Munitions Stock */}
                  <div className="p-2.5 rounded-lg bg-slate-900 text-white text-xs space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Ready Ammunition Emplaced
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-1.5 rounded bg-white/10">
                        <div className="text-[10px] text-slate-300">High Explosive</div>
                        <div className="font-mono font-bold text-rose-400 text-sm">{dep.rounds_he}</div>
                      </div>
                      <div className="p-1.5 rounded bg-white/10">
                        <div className="text-[10px] text-slate-300">Smoke / Screen</div>
                        <div className="font-mono font-bold text-amber-300 text-sm">{dep.rounds_smoke}</div>
                      </div>
                      <div className="p-1.5 rounded bg-white/10">
                        <div className="text-[10px] text-slate-300">Illumination</div>
                        <div className="font-mono font-bold text-blue-300 text-sm">{dep.rounds_illum}</div>
                      </div>
                    </div>
                  </div>

                  {/* Base location & MGRS */}
                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{dep.address}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-500">MGRS: <span className="font-bold text-slate-800">{dep.mgrs}</span></span>
                      <span className="text-slate-500 text-[10px]">{dep.azimuth_coverage}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setMapCenter([dep.lat, dep.lng]);
                        setMapZoom(13);
                        setFocusedId(dep.id);
                      }}
                      className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Focus on Map</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingDeployment(dep);
                          setIsDeploymentModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                        title="Edit Battery"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDeployment(dep.id)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200"
                        title="Delete Battery"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500">
                    <th className="py-2.5 px-3">Callsign</th>
                    <th className="py-2.5 px-3">Unit &amp; Commander</th>
                    <th className="py-2.5 px-3">Weapon System</th>
                    <th className="py-2.5 px-3 text-center">Tubes</th>
                    <th className="py-2.5 px-3">Max Range</th>
                    <th className="py-2.5 px-3">MGRS &amp; Emplacement</th>
                    <th className="py-2.5 px-3">Munitions (HE/SMK/ILL)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeployments.map((dep) => (
                    <tr key={dep.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {dep.callsign}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{dep.unit_name}</div>
                        <div className="text-[10px] text-slate-500">{dep.commander}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {dep.weapon_type}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                        {dep.tube_count}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {dep.max_range_km} km
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-slate-800 font-semibold">{dep.mgrs}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">{dep.address}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                        <span className="text-rose-600 font-bold">{dep.rounds_he}</span> /{' '}
                        <span className="text-amber-600 font-bold">{dep.rounds_smoke}</span> /{' '}
                        <span className="text-blue-600 font-bold">{dep.rounds_illum}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${getDeploymentStatusBadge(dep.status)}`}>
                          {dep.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setMapCenter([dep.lat, dep.lng]);
                              setMapZoom(13);
                              setFocusedId(dep.id);
                            }}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600"
                            title="Focus on Map"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingDeployment(dep);
                              setIsDeploymentModalOpen(true);
                            }}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600"
                            title="Edit Battery"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDeployment(dep.id)}
                            className="p-1 rounded hover:bg-rose-50 text-rose-600"
                            title="Delete Battery"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── MODALS ──────────────────────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <FireTargetModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        onSave={handleSaveTarget}
        initialData={editingTarget}
        availableBatteries={batteryNames}
      />

      <FiresDeploymentModal
        isOpen={isDeploymentModalOpen}
        onClose={() => setIsDeploymentModalOpen(false)}
        onSave={handleSaveDeployment}
        initialData={editingDeployment}
      />

      <FireMissionModal
        isOpen={isMissionModalOpen}
        onClose={() => setIsMissionModalOpen(false)}
        onSave={handleSaveMission}
        initialData={editingMission}
        targets={targets}
        batteries={deployments}
      />

      {/* SQL Setup Modal */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase">
                  Supabase SQL Setup for Fire Support Cell
                </h3>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Run this script in your Supabase SQL editor to create the persistent tables for Fire Targets,
              Fires Deployments, and Fire Missions with Row-Level Security:
            </p>

            <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-auto flex-1 max-h-[350px]">
              {sqlSetupScript}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlSetupScript);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition-all"
              >
                {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
              </button>

              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

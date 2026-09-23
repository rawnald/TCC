'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RecordItem } from '@/types';
import {
  Navigation,
  Crosshair,
  Wifi,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RefreshCw,
  Hand,
  Mountain,
  Layers,
  Map as MapIcon,
  Globe,
} from 'lucide-react';
import { resolveCoordinates, toMGRS, toZuluDTG } from '@/lib/mgrsUtils';

// ─── CATEGORY COLOR MAP ───────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  incidents: '#ef4444',
  units: '#22d3ee',
  locations: '#a855f7',
  tasks: '#3b82f6',
  equipment: '#84cc16',
  personnel: '#10b981',
  reports: '#3b82f6',
  documents: '#94a3b8',
};

function getCategoryColor(record: RecordItem): string {
  return CATEGORY_COLORS[record.category] || '#64748b';
}

export type GoogleMapLayerType = 'terrain' | 'satellite' | 'roadmap';

const GOOGLE_TILE_CONFIGS: Record<
  GoogleMapLayerType,
  { url: string; subdomains: string[]; maxZoom: number; label: string; icon: any; attribution: string }
> = {
  terrain: {
    url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    label: 'Google Terrain',
    icon: Mountain,
    attribution: '&copy; Google Maps (Terrain Relief)',
  },
  satellite: {
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    label: 'Satellite Hybrid',
    icon: Globe,
    attribution: '&copy; Google Maps (Satellite)',
  },
  roadmap: {
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    label: 'Roadmap',
    icon: MapIcon,
    attribution: '&copy; Google Maps (Roads)',
  },
};

function patchLeafletPrototypes(L: any) {
  if (!L || (L as any).__leaflet_pos_patched) return;
  (L as any).__leaflet_pos_patched = true;

  if (L.DomUtil) {
    const origGetPosition = L.DomUtil.getPosition;
    if (typeof origGetPosition === 'function') {
      L.DomUtil.getPosition = function (el: any) {
        if (!el) return new L.Point(0, 0);
        try {
          return origGetPosition.call(L.DomUtil, el) || new L.Point(0, 0);
        } catch {
          return new L.Point(0, 0);
        }
      };
    }

    const origSetPosition = L.DomUtil.setPosition;
    if (typeof origSetPosition === 'function') {
      L.DomUtil.setPosition = function (el: any, point: any) {
        if (!el) return;
        try {
          origSetPosition.call(L.DomUtil, el, point);
        } catch {}
      };
    }
  }

  if (L.Popup && L.Popup.prototype) {
    const origAdjustPan = (L.Popup.prototype as any)._adjustPan;
    if (typeof origAdjustPan === 'function') {
      (L.Popup.prototype as any)._adjustPan = function () {
        if (!this._container || !this._map) return;
        try {
          origAdjustPan.call(this);
        } catch {}
      };
    }
  }

  if (L.PosAnimation && L.PosAnimation.prototype) {
    const origRun = (L.PosAnimation.prototype as any).run;
    if (typeof origRun === 'function') {
      (L.PosAnimation.prototype as any).run = function (
        el: any,
        newPos: any,
        duration: any,
        easeLinearity: any
      ) {
        if (!el) return;
        try {
          origRun.call(this, el, newPos, duration, easeLinearity);
        } catch {}
      };
    }
  }
}

export interface TacticalLink {
  id: string;
  from: [number, number];
  to: [number, number];
  label?: string;
  color?: string; // e.g. '#ef4444' for feuds, '#10b981' for MILF alliances
  dashArray?: string;
  weight?: number;
  opacity?: number;
  badgeText?: string; // e.g. '(versus)' or '(affiliated)'
}

interface TacticalMapProps {
  records: RecordItem[];
  onSelectRecord?: (record: RecordItem) => void;
  pickMode?: boolean;
  onPickCoordinates?: (lat: number, lng: number) => void;
  className?: string;
  center?: [number, number];
  zoom?: number;
  focusedRecordId?: string | null;
  isLive?: boolean;
  autoRefreshInterval?: number; // default 10000ms (10s)
  onRefresh?: () => Promise<void> | void;
  customLinks?: TacticalLink[];
}

export default function TacticalMap({
  records,
  onSelectRecord,
  pickMode = false,
  onPickCoordinates,
  className = 'h-[500px] w-full',
  center = [12.8797, 121.7740], // Philippines center
  zoom = 6,
  focusedRecordId,
  isLive = true,
  autoRefreshInterval = 0,
  onRefresh,
  customLinks = [],
}: TacticalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const linesLayerRef = useRef<any>(null);
  const markerMapRef = useRef<Map<string, any>>(new Map());
  const hasFittedInitialBoundsRef = useRef(false);
  const panIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState<GoogleMapLayerType>('terrain');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    } catch {
      /* silent */
    } finally {
      setIsRefreshing(false);
    }
  };

  // ── Periodic Map Viewport Re-validation (No database calls) ──
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;

    const timer = setInterval(() => {
      // Invalidate Leaflet viewport geometry only without triggering database egress
      if (mapInstanceRef.current && typeof document !== 'undefined' && !document.hidden) {
        mapInstanceRef.current.invalidateSize();
      }
    }, Math.max(autoRefreshInterval, 60000)); // Minimum 60s

    return () => clearInterval(timer);
  }, [autoRefreshInterval]);

  // ─── Continuous Pan on Hold (D-Pad Controls) ─────────────────────────────────
  const startPan = (dx: number, dy: number) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panBy([dx, dy], { animate: false });

    if (panIntervalRef.current) clearInterval(panIntervalRef.current);
    panIntervalRef.current = setInterval(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panBy([dx * 1.5, dy * 1.5], { animate: false });
      }
    }, 70);
  };

  const stopPan = () => {
    if (panIntervalRef.current) {
      clearInterval(panIntervalRef.current);
      panIntervalRef.current = null;
    }
  };

  const resetToCenter = async () => {
    if (!mapInstanceRef.current) return;
    const resolvedCoords: [number, number][] = [];
    records.forEach((r) => {
      const c = resolveCoordinates(r);
      if (c) resolvedCoords.push(c);
    });

    if (resolvedCoords.length > 0) {
      const L = (await import('leaflet')).default;
      patchLeafletPrototypes(L);
      const bounds = L.latLngBounds(resolvedCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: false });
    } else {
      mapInstanceRef.current.setView(center, zoom, { animate: false });
    }
  };

  // ─── Init map with Google Terrain tiles, mouse dragging, and responsive handlers ─
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    const cleanupFns: Array<() => void> = [];
    let isCancelled = false;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      patchLeafletPrototypes(L);

      if (isCancelled || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      // Guard against React 18 Strict Mode double-init
      if ((mapContainerRef.current as any)?._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      if (!mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        inertia: true,
        inertiaDeceleration: 3000,
      } as any).setView(center, zoom);

      // Explicitly enable map dragging and gesture handlers
      map.dragging.enable();
      if (map.touchZoom) map.touchZoom.enable();
      if (map.scrollWheelZoom) map.scrollWheelZoom.enable();
      if (map.doubleClickZoom) map.doubleClickZoom.enable();
      if (map.boxZoom) map.boxZoom.enable();
      if (map.keyboard) map.keyboard.enable();

      // Google Terrain Tile Layer (Default)
      const initialConfig = GOOGLE_TILE_CONFIGS[activeLayer] || GOOGLE_TILE_CONFIGS.terrain;
      const baseTileLayer = L.tileLayer(initialConfig.url, {
        subdomains: initialConfig.subdomains,
        maxZoom: initialConfig.maxZoom,
        className: 'tactical-map-tiles',
      }).addTo(map);

      tileLayerRef.current = baseTileLayer;

      L.control
        .attribution({ position: 'bottomright', prefix: false })
        .addAttribution('&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>')
        .addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      const linesLayer = L.layerGroup().addTo(map);
      linesLayerRef.current = linesLayer;
      mapInstanceRef.current = map;
      setMapReady(true);

      // Click callback for coordinate picking
      map.on('click', (e: any) => {
        if (pickMode && onPickCoordinates) {
          onPickCoordinates(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
        }
      });

      // Safely recalculate dimensions across render ticks only if map is still active
      const safeInvalidate = () => {
        try {
          if (mapInstanceRef.current && (mapInstanceRef.current as any)._leaflet_id && (mapInstanceRef.current as any)._mapPane) {
            mapInstanceRef.current.invalidateSize();
          }
        } catch {
          // Ignore if unmounted during size recalculation
        }
      };

      const rafId = requestAnimationFrame(safeInvalidate);
      const timer1 = setTimeout(safeInvalidate, 150);
      const timer2 = setTimeout(safeInvalidate, 500);

      // Responsive Observer: automatically update Leaflet container size when parent/window resizes
      if (mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          safeInvalidate();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      cleanupFns.push(() => {
        cancelAnimationFrame(rafId);
        clearTimeout(timer1);
        clearTimeout(timer2);
      });
    }

    initMap();

    return () => {
      isCancelled = true;
      setMapReady(false);
      cleanupFns.forEach((fn) => fn());
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      stopPan();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore if already destroyed
        }
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markersLayerRef.current = null;
        markerMapRef.current.clear();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Switch Google Map Tile Layers (Terrain, Satellite, Roadmap) ─────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const config = GOOGLE_TILE_CONFIGS[activeLayer] || GOOGLE_TILE_CONFIGS.terrain;

    import('leaflet').then(({ default: L }) => {
      patchLeafletPrototypes(L);
      if (!mapInstanceRef.current) return;
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }
      const newLayer = L.tileLayer(config.url, {
        subdomains: config.subdomains,
        maxZoom: config.maxZoom,
        className: 'tactical-map-tiles',
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newLayer;
      newLayer.bringToBack();
    });
  }, [activeLayer]);

  // ─── Update markers whenever records change or map becomes ready ─────────────
  useEffect(() => {
    let isCancelled = false;

    async function updateMarkers() {
      if (!mapReady || !mapInstanceRef.current || !markersLayerRef.current) return;

      const L = (await import('leaflet')).default;
      patchLeafletPrototypes(L);
      if (isCancelled) return;

      const markersLayer = markersLayerRef.current;
      if (!markersLayer || !mapInstanceRef.current) return;

      try {
        if (mapInstanceRef.current && typeof mapInstanceRef.current.closePopup === 'function') {
          mapInstanceRef.current.closePopup();
        }
        markersLayer.clearLayers();
      } catch {
        return;
      }
      markerMapRef.current.clear();

      const unitLogoCache: Record<string, string> = (() => {
        try {
          return JSON.parse(localStorage.getItem('tactical_unit_logos') || '{}');
        } catch {
          return {};
        }
      })();

      const resolvedRecords: { record: RecordItem; coords: [number, number] }[] = [];

      records.forEach((record) => {
        const coords = resolveCoordinates(record);
        if (!coords) return;
        resolvedRecords.push({ record, coords });

        const isIncident = record.category === 'incidents';
        const isTasking = record.category === 'tasks';
        const isUnit = record.category === 'units';
        const isCritical = record.priority === 'critical';
        const isHigh = record.priority === 'high';
        const color = getCategoryColor(record);

        const isPiag =
          record.metadata?.is_piag === true ||
          record.metadata?.cmo_type === 'piag' ||
          (record.code && record.code.startsWith('PIAG-')) ||
          (record.title && record.title.startsWith('[PIAG]'));

        const isDib =
          record.metadata?.intel_type === 'dib' ||
          record.metadata?.is_dib === true ||
          (record.category === 'reports' &&
            ((record.code && record.code.startsWith('DIB-')) ||
              (record.title && record.title.startsWith('[DIB]'))));

        const isIntelHostile =
          !isDib &&
          !isPiag &&
          (record.metadata?.is_hostile === true ||
            record.metadata?.intel_type === 'enemy_location' ||
            record.metadata?.intel_type === 'enemy_profile_location' ||
            record.metadata?.source_table === 'enemy_profiles');

        const isHvtProfile =
          !isDib &&
          !isPiag &&
          (record.category === 'reports' || record.category === 'personnel') &&
          (record.metadata?.type === 'enemy_profile' ||
            record.metadata?.source_table === 'enemy_profiles' ||
            record.metadata?.intel_type === 'enemy_profile_location');

        const titleUpper = (record.title || '').toUpperCase();
        const isHostile =
          !isDib &&
          !isPiag &&
          (isIntelHostile ||
            titleUpper.includes('HOSTILE') ||
            titleUpper.includes('ENEMY') ||
            titleUpper.includes('SIGHTING') ||
            titleUpper.includes('TERRORIST') ||
            titleUpper.includes('THREAT') ||
            titleUpper.includes('TARGET'));

        const isArmedClash =
          !isDib &&
          !isPiag &&
          (titleUpper.includes('ARMED CLASH') ||
            titleUpper.includes('FIREFIGHT') ||
            titleUpper.includes('CONTACT') ||
            titleUpper.includes('ENCOUNTER'));

        const taskingLogo =
          record.metadata?.logo_url ||
          record.metadata?.unit_logo ||
          (record.metadata?.unit_id ? unitLogoCache[record.metadata.unit_id] : '') ||
          (record.metadata?.battalion ? unitLogoCache[record.metadata.battalion] : '') ||
          '';

        const unitLogo =
          record.metadata?.logo_url ||
          record.metadata?.unit_logo ||
          unitLogoCache[record.id] ||
          (record.metadata?.battalion ? unitLogoCache[record.metadata.battalion] : '') ||
          '';

        let iconHtml = '';
        let iconSize: [number, number] = [24, 24];
        let iconAnchor: [number, number] = [12, 12];
        let popupAnchor: [number, number] = [0, -14];

        const isRidoParty =
          record.metadata?.is_rido_party === true ||
          record.metadata?.cmo_type === 'rido_party';

        if (isRidoParty) {
          const partyType = record.metadata?.party_type || 'A';
          const isPartyA = partyType === 'A';
          const pinColor = '#000000'; // Black location icon for all connected RIDO
          const badgeBorder = '#000000';
          const clanName =
            record.metadata?.clan_name ||
            (record.title ? record.title.replace(/\s*\((Clan|Party)\s+[AB12]\)/i, '').trim() : '') ||
            (isPartyA ? 'Party A' : 'Party B');

          iconSize = [20, 20];
          iconAnchor = [10, 20];
          popupAnchor = [0, -32];

          iconHtml = `
            <div style="position:relative;width:20px;height:20px;display:flex;flex-direction:column;align-items:center;cursor:pointer;overflow:visible;" title="${clanName} — Click to view Rido dossier">
              <!-- Floating Clan Name Banner directly above the pin (No circle before name) -->
              <div style="position:absolute;bottom:24px;left:50%;transform:translateX(-50%);display:flex;align-items:center;background:#0f172a;border:1.5px solid ${badgeBorder};border-radius:4px;padding:2px 8px;box-shadow:0 3px 8px rgba(0,0,0,0.55);white-space:nowrap;z-index:10;pointer-events:auto;">
                <span style="color:#ffffff;font-size:11px;font-weight:700;letter-spacing:0.2px;font-family:ui-sans-serif,system-ui,sans-serif;">${clanName}</span>
                <!-- downward arrow tip pointing directly to the pin -->
                <div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid ${badgeBorder};"></div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${pinColor}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
              </svg>
            </div>
          `;
        } else if (isPiag) {
          // Determine if group element is MNLF, otherwise MILF
          const rawGroup = (
            record.metadata?.group_name ||
            record.metadata?.element_name ||
            record.title ||
            ''
          ).toUpperCase();
          const isMnlf = rawGroup.includes('MNLF');
          const groupTag = isMnlf ? 'MNLF' : 'MILF';
          const pinColor = isMnlf ? '#ef4444' : '#10b981'; // red for MNLF, green for MILF / other
          const badgeBg = isMnlf ? '#dc2626' : '#059669';

          // Size 15 location icon with bottom tip anchor and badge above
          iconSize = [20, 26];
          iconAnchor = [10, 24];
          popupAnchor = [0, -25];

          iconHtml = `
            <div style="position:relative;width:20px;height:26px;display:flex;flex-direction:column;align-items:center;cursor:pointer;" title="[PIAG LOCATION] ${groupTag} - ${record.title}">
              <div style="position:absolute;top:-7px;background:${badgeBg};color:#ffffff;font-size:7.5px;font-weight:bold;padding:0 2.5px;border-radius:2px;border:1px solid #ffffff;letter-spacing:0.3px;z-index:4;box-shadow:0 1px 3px rgba(0,0,0,0.35);line-height:11px;white-space:nowrap;">${groupTag}</div>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="${pinColor}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));margin-top:9px;">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
              </svg>
            </div>
          `;
        } else if (isDib) {
          iconSize = [20, 20];
          iconAnchor = [10, 10];
          popupAnchor = [0, -12];
          iconHtml = `
            <div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="[DIB BULLETIN] ${record.title}">
              <div style="position:absolute;width:16px;height:16px;border-radius:50%;background:rgba(239,68,68,0.22);border:1.5px solid rgba(239,68,68,0.7);"></div>
              <div style="position:relative;z-index:3;width:9px;height:9px;border-radius:50%;background:#ef4444;box-shadow:0 0 6px rgba(239,68,68,0.85);border:1.5px solid #ffffff;"></div>
            </div>
          `;
        } else if (isHvtProfile) {
          iconSize = [24, 24];
          iconAnchor = [12, 12];
          popupAnchor = [0, -14];
          iconHtml = `
            <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="[HVT PROFILE] ${record.title}">
              <div class="animate-red-beacon" style="position:absolute;width:20px;height:20px;border-radius:50%;background:rgba(220,38,38,0.5);border:2px solid #dc2626;"></div>
              <div style="position:relative;z-index:3;width:10px;height:10px;border-radius:50%;background:#b91c1c;box-shadow:0 0 10px #dc2626, 0 0 4px #fef08a;border:2px solid #fef08a;"></div>
            </div>
          `;
        } else if (isHostile || isArmedClash) {
          iconSize = [24, 24];
          iconAnchor = [12, 12];
          popupAnchor = [0, -14];
          iconHtml = `
            <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="${isArmedClash ? 'Armed Clash' : 'Hostile Contact'}: ${record.title}">
              <div class="animate-red-beacon" style="position:absolute;width:20px;height:20px;border-radius:50%;background:rgba(239,68,68,0.5);border:2px solid #ef4444;"></div>
              <div style="position:relative;z-index:3;width:10px;height:10px;border-radius:50%;background:#ef4444;box-shadow:0 0 10px #ef4444, 0 0 4px #ffffff;border:2px solid #ffffff;"></div>
            </div>
          `;
        } else if (isIncident) {
          if (isCritical) {
            iconSize = [22, 22];
            iconAnchor = [11, 11];
            popupAnchor = [0, -14];
            iconHtml = `
              <div style="position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="[CRITICAL INCIDENT] ${record.title}">
                <div class="animate-red-beacon" style="position:absolute;width:18px;height:18px;border-radius:50%;background:rgba(239,68,68,0.35);border:2px solid #ef4444;"></div>
                <div style="width:10px;height:10px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444;border:2px solid #ffffff;z-index:3;"></div>
              </div>
            `;
          } else if (isHigh) {
            iconSize = [20, 20];
            iconAnchor = [10, 10];
            popupAnchor = [0, -12];
            iconHtml = `
              <div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="[HIGH PRIORITY] ${record.title}">
                <div class="animate-amber-beacon" style="position:absolute;width:16px;height:16px;border-radius:50%;background:rgba(245,158,11,0.35);border:2px solid #f59e0b;"></div>
                <div style="width:10px;height:10px;border-radius:50%;background:#f59e0b;box-shadow:0 0 8px #f59e0b;border:2px solid #ffffff;z-index:3;"></div>
              </div>
            `;
          } else {
            iconSize = [18, 18];
            iconAnchor = [9, 9];
            popupAnchor = [0, -10];
            iconHtml = `
              <div style="position:relative;width:18px;height:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="${record.title}">
                <div style="width:10px;height:10px;border-radius:50%;background:#ef4444;box-shadow:0 0 6px rgba(239,68,68,0.7);border:1.5px solid #ffffff;z-index:2;"></div>
              </div>
            `;
          }
        } else if (isTasking) {
          if (taskingLogo) {
            iconSize = [24, 24];
            iconAnchor = [12, 12];
            popupAnchor = [0, -14];
            iconHtml = `
              <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="Unit Tasking: ${record.title}">
                <div style="position:absolute;width:20px;height:20px;border-radius:4px;background:rgba(37,99,235,0.2);border:1.5px solid #3b82f6;box-shadow:0 0 8px rgba(37,99,235,0.95);"></div>
                <div style="position:relative;z-index:2;width:16px;height:16px;border-radius:2px;overflow:hidden;background:#020617;border:1px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;padding:1px;">
                  <img src="${taskingLogo}" alt="${record.title}" style="width:100%!important;height:100%!important;object-fit:contain!important;" />
                </div>
              </div>
            `;
          } else {
            iconSize = [20, 20];
            iconAnchor = [10, 10];
            popupAnchor = [0, -12];
            iconHtml = `
              <div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="Unit Tasking: ${record.title}">
                <svg width="20" height="20" viewBox="0 0 24 24" style="position:absolute;top:0;left:0;filter:drop-shadow(0 0 6px rgba(37,99,235,0.9));">
                  <polygon points="12,2 22,20 2,20" fill="rgba(37,99,235,0.35)" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round" />
                </svg>
                <svg width="11" height="11" viewBox="0 0 24 24" style="position:relative;z-index:2;filter:drop-shadow(0 0 4px #60a5fa);">
                  <polygon points="12,3 21,19 3,19" fill="#2563eb" stroke="#ffffff" stroke-width="2" stroke-linejoin="round" />
                </svg>
              </div>
            `;
          }
        } else if (isUnit) {
          if (unitLogo) {
            iconSize = [24, 24];
            iconAnchor = [12, 12];
            popupAnchor = [0, -14];
            iconHtml = `
              <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="Friendly Unit: ${record.title}">
                <div style="position:absolute;width:20px;height:20px;border-radius:4px;background:rgba(6,182,212,0.2);border:1.5px solid #06b6d4;box-shadow:0 0 8px rgba(6,182,212,0.95);"></div>
                <div style="position:relative;z-index:2;width:16px;height:16px;border-radius:2px;overflow:hidden;background:#020617;border:1px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;padding:1px;">
                  <img src="${unitLogo}" alt="${record.title}" style="width:100%!important;height:100%!important;object-fit:contain!important;" />
                </div>
              </div>
            `;
          } else {
            iconSize = [20, 20];
            iconAnchor = [10, 10];
            popupAnchor = [0, -12];
            iconHtml = `
              <div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="Friendly Unit: ${record.title}">
                <svg width="20" height="20" viewBox="0 0 24 24" style="position:absolute;top:0;left:0;filter:drop-shadow(0 0 6px rgba(6,182,212,0.85));">
                  <polygon points="12,2 22,20 2,20" fill="rgba(6,182,212,0.3)" stroke="#06b6d4" stroke-width="2" stroke-linejoin="round" />
                </svg>
                <svg width="11" height="11" viewBox="0 0 24 24" style="position:relative;z-index:2;filter:drop-shadow(0 0 4px #22d3ee);">
                  <polygon points="12,3 21,19 3,19" fill="#0891b2" stroke="#ffffff" stroke-width="2" stroke-linejoin="round" />
                </svg>
              </div>
            `;
          }
        } else {
          iconHtml = `
            <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
              <div style="position:absolute;width:20px;height:20px;border-radius:50%;background:${color}33;border:1.5px solid ${color};"></div>
              <div style="width:9px;height:9px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};border:1.5px solid #ffffff;z-index:2;"></div>
            </div>
          `;
        }

        const customIcon = L.divIcon({
          className: 'tactical-custom-marker',
          html: iconHtml,
          iconSize,
          iconAnchor,
          popupAnchor,
        });

        const categoryLabel = isPiag
          ? 'PRIVATE ARMED GROUP (PIAG)'
          : isDib
          ? 'DAILY INTEL BULLETIN (DIB)'
          : isHvtProfile
          ? 'HVT ENEMY PROFILE'
          : isHostile
          ? 'HOSTILE CONTACT (ENEMY SIGHTING)'
          : isArmedClash
          ? 'ARMED CLASH (ACTIVE)'
          : isIncident
          ? 'INCIDENT (SIGACT)'
          : isTasking
          ? 'UNIT TASKING'
          : isUnit
          ? 'FRIENDLY UNIT'
          : record.category.charAt(0).toUpperCase() + record.category.slice(1);
        const mgrs = record.metadata?.mgrs || toMGRS(coords[0], coords[1]);
        const dtg = toZuluDTG(record.created_at);
        const narrative = record.description
          ? record.description.slice(0, 120) + (record.description.length > 120 ? '…' : '')
          : '';

        const rawGroup = (
          record.metadata?.group_name ||
          record.metadata?.element_name ||
          record.title ||
          ''
        ).toUpperCase();
        const isMnlf = rawGroup.includes('MNLF');
        const piagGroupDisplay = isMnlf ? 'MNLF' : 'MILF';
        const piagColor = isMnlf ? '#ef4444' : '#10b981';

        const popupContent = isRidoParty ? `
          <div style="font-family:inherit;min-width:240px;max-width:310px;font-size:11px;color:#f1f5f9;">
            <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #334155;padding-bottom:5px;margin-bottom:6px;">
              <span style="font-size:9px;font-weight:bold;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.05em;">
                RIDO FEUD // ${record.metadata?.party_type === 'A' ? 'PARTY A' : 'PARTY B'}
              </span>
              <span style="font-size:9px;font-weight:bold;padding:1px 5px;border-radius:3px;background:#0f172a;color:#cbd5e1;border:1px solid #334155;">${record.code || 'FEUD'}</span>
            </div>
            <div style="font-weight:bold;font-size:13px;color:#ffffff;margin-bottom:4px;line-height:1.3;">
              ${record.metadata?.clan_name || record.title}
            </div>
            <div style="display:flex;flex-direction:column;gap:3px;font-size:11px;color:#cbd5e1;background:#1e293b;padding:6px;border-radius:6px;border:1px solid #334155;margin-bottom:6px;">
              ${record.metadata?.affiliation ? `<div><span style="color:#94a3b8;font-size:10px;">Affiliation:</span> <strong style="color:${record.metadata.affiliation.toUpperCase().includes('MILF') ? '#34d399' : '#f87171'};">${record.metadata.affiliation}</strong></div>` : ''}
              ${record.metadata?.personalities ? `<div><span style="color:#94a3b8;font-size:10px;">Key Personnel:</span> <span style="color:#ffffff;">${record.metadata.personalities}</span></div>` : ''}
              ${record.metadata?.opposing_party ? `<div><span style="color:#94a3b8;font-size:10px;">Feuding Against:</span> <span style="color:#f43f5e;font-weight:bold;">${record.metadata.opposing_party}</span></div>` : ''}
              ${record.metadata?.root_cause ? `<div><span style="color:#94a3b8;font-size:10px;">Root Cause:</span> <span style="color:#e2e8f0;">${record.metadata.root_cause}</span></div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:2px;font-size:10px;color:#94a3b8;border-top:1px solid #334155;padding-top:5px;">
              <div style="display:flex;justify-content:space-between;"><span>Area:</span><span style="color:#e2e8f0;font-weight:600;">${record.location_name || ''}</span></div>
              <div style="display:flex;justify-content:space-between;"><span>MGRS:</span><span style="color:#38bdf8;font-weight:bold;">${mgrs}</span></div>
              <div style="display:flex;justify-content:space-between;"><span>Status:</span><span style="color:#38bdf8;font-weight:bold;text-transform:uppercase;">${record.metadata?.status || record.status}</span></div>
            </div>
          </div>
        ` : isPiag ? `
          <div style="font-family:inherit;min-width:240px;max-width:300px;font-size:11px;color:#f1f5f9;">
            <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #334155;padding-bottom:5px;margin-bottom:6px;">
              <span style="font-size:9px;font-weight:bold;color:${piagColor};text-transform:uppercase;letter-spacing:0.05em;">${piagGroupDisplay} — PRIVATE ARMED GROUP</span>
              <span style="font-size:9px;font-weight:bold;padding:1px 5px;border-radius:3px;background:#0f172a;color:${piagColor};border:1px solid #334155;">${record.code || ''}</span>
            </div>
            <div style="font-weight:bold;font-size:13px;color:#ffffff;margin-bottom:4px;line-height:1.3;display:flex;align-items:center;gap:6px;">
              <span style="background:${piagColor};color:#ffffff;font-size:10px;padding:1px 5px;border-radius:4px;font-weight:bold;">${piagGroupDisplay}</span>
              <span>${record.metadata?.group_name || record.title}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:3px;font-size:11px;color:#cbd5e1;background:#1e293b;padding:6px;border-radius:6px;border:1px solid #334155;margin-bottom:6px;">
              <div><span style="color:#94a3b8;font-size:10px;">Commander:</span> <strong style="color:#ffffff;">${record.metadata?.commander_leader || 'Unspecified'}</strong></div>
              <div><span style="color:#94a3b8;font-size:10px;">Strength:</span> <span style="color:${isMnlf ? '#f87171' : '#34d399'};font-weight:bold;">${record.metadata?.estimated_strength || 'Unknown'}</span></div>
              ${record.metadata?.affiliated_politician_faction ? `<div><span style="color:#94a3b8;font-size:10px;">Affiliation:</span> <span style="color:#60a5fa;">${record.metadata.affiliated_politician_faction}</span></div>` : ''}
              ${(record.metadata?.total_est_firearms || record.metadata?.firearms_inventory) ? `<div><span style="color:#94a3b8;font-size:10px;">Firearms:</span> <span style="color:#e2e8f0;">${record.metadata?.total_est_firearms || record.metadata?.firearms_inventory}</span></div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:2px;font-size:10px;color:#94a3b8;border-top:1px solid #334155;padding-top:5px;">
              <div style="display:flex;justify-content:space-between;"><span>Location:</span><span style="color:#e2e8f0;font-weight:600;">${record.location_name || ''}</span></div>
              <div style="display:flex;justify-content:space-between;"><span>MGRS:</span><span style="color:#38bdf8;font-weight:bold;">${mgrs}</span></div>
              <div style="display:flex;justify-content:space-between;"><span>Status:</span><span style="color:${record.status === 'closed' ? '#94a3b8' : '#34d399'};font-weight:bold;text-transform:uppercase;">${record.metadata?.status || record.status}</span></div>
            </div>
          </div>
        ` : `
          <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;min-width:220px;max-width:280px;font-size:11px;color:#f1f5f9;">
            <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1e2c3f;padding-bottom:5px;margin-bottom:6px;">
              <span style="font-size:9px;font-weight:bold;color:${color};text-transform:uppercase;letter-spacing:0.05em;">${categoryLabel}</span>
              <span style="font-size:9px;font-weight:bold;padding:1px 5px;border-radius:3px;background:#06090e;color:#38bdf8;border:1px solid #1e2c3f;">${record.code || ''}</span>
            </div>
            <div style="font-weight:bold;font-size:12px;color:#f8fafc;margin-bottom:4px;line-height:1.3;">${record.title}</div>
            ${narrative ? `<div style="font-size:10px;color:#94a3b8;margin-bottom:6px;line-height:1.3;">${narrative}</div>` : ''}
            <div style="display:flex;flex-direction:column;gap:2px;font-size:10px;color:#64748b;border-top:1px solid #141e2c;padding-top:5px;margin-top:4px;">
              <div style="display:flex;justify-content:space-between;"><span>MGRS:</span><span style="color:#38bdf8;font-weight:bold;">${mgrs}</span></div>
              <div style="display:flex;justify-content:space-between;"><span>LAT/LNG:</span><span style="color:#94a3b8;">${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}</span></div>
              <div style="display:flex;justify-content:space-between;"><span>DTG:</span><span style="color:#64748b;">${dtg}</span></div>
            </div>
          </div>
        `;

        const marker = L.marker(coords, { icon: customIcon }).bindPopup(popupContent, {
          maxWidth: 320,
          className: 'tactical-custom-popup',
          autoPan: false,
        });

        marker.on('click', () => {
          if (onSelectRecord) onSelectRecord(record);
        });

        if (isCancelled || !markersLayerRef.current) return;
        markersLayer.addLayer(marker);
        markerMapRef.current.set(record.id, { marker, coords });
      });

      // Fit bounds only once on initial load
      if (resolvedRecords.length > 0 && mapInstanceRef.current && !hasFittedInitialBoundsRef.current && !isCancelled) {
        try {
          const bounds = L.latLngBounds(resolvedRecords.map(({ coords }) => coords));
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: false });
          hasFittedInitialBoundsRef.current = true;
        } catch {
          // ignore if map unmounted
        }
      }
    }

    updateMarkers();

    return () => {
      isCancelled = true;
    };
  }, [records, onSelectRecord, mapReady]);

  // ─── Render Tactical Links / Polylines (e.g. Clan Feud Lines, MILF Alliances) ─
  useEffect(() => {
    if (!mapReady || !linesLayerRef.current || !mapInstanceRef.current) return;
    let isCancelled = false;

    import('leaflet').then(({ default: L }) => {
      if (isCancelled || !linesLayerRef.current) return;
      linesLayerRef.current.clearLayers();

      if (!customLinks || customLinks.length === 0) return;

      customLinks.forEach((link) => {
        if (!link.from || !link.to) return;
        if (!link.from[0] || !link.from[1] || !link.to[0] || !link.to[1]) return;

        const latlngs: [number, number][] = [link.from, link.to];
        const color = link.color || '#ef4444';
        const dashArray = link.dashArray || '6, 6';
        const weight = link.weight || 2.5;
        const opacity = link.opacity || 0.85;

        // Outer glow line
        const glowLine = L.polyline(latlngs, {
          color,
          weight: weight + 3,
          opacity: 0.25,
          lineCap: 'round',
        });

        // Core tactical dashed line
        const polyline = L.polyline(latlngs, {
          color,
          weight,
          opacity,
          dashArray,
          lineCap: 'round',
        });

        if (link.label) {
          polyline.bindTooltip(link.label, {
            permanent: false,
            sticky: true,
            direction: 'center',
            className: 'tactical-link-tooltip',
          });
        }

        if (linesLayerRef.current) {
          linesLayerRef.current.addLayer(glowLine);
          linesLayerRef.current.addLayer(polyline);

          // Render (vs) or (affiliated) text directly along the tactical line (transparent background)
          const isFeud = color === '#ef4444' || link.id.includes('feud');
          const isAffiliated = color === '#10b981' || link.id.includes('milf') || link.id.includes('affil');
          const badgeText = link.badgeText || (isFeud ? '(vs)' : isAffiliated ? '(affiliated)' : '');

          if (badgeText) {
            const midLat = (link.from[0] + link.to[0]) / 2;
            const midLng = (link.from[1] + link.to[1]) / 2;
            const textColor = isFeud ? '#ef4444' : isAffiliated ? '#059669' : color;

            const badgeIcon = L.divIcon({
              className: 'tactical-link-badge',
              html: `
                <div style="transform:translate(-50%, -50%);display:inline-flex;align-items:center;justify-content:center;background:transparent;color:${textColor};font-size:10px;font-weight:900;font-family:ui-sans-serif,system-ui,sans-serif;padding:0 3px;white-space:nowrap;pointer-events:auto;letter-spacing:0.4px;line-height:14px;text-shadow:-1.5px -1.5px 0 #ffffff, 1.5px -1.5px 0 #ffffff, -1.5px 1.5px 0 #ffffff, 1.5px 1.5px 0 #ffffff, 0 1px 3px rgba(0,0,0,0.5);">
                  ${badgeText}
                </div>
              `,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            });

            const badgeMarker = L.marker([midLat, midLng], {
              icon: badgeIcon,
              interactive: true,
            });

            if (link.label) {
              badgeMarker.bindTooltip(link.label, {
                direction: 'top',
                offset: [0, -8],
                className: 'tactical-link-tooltip',
              });
            }

            linesLayerRef.current.addLayer(badgeMarker);
          }
        }
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [customLinks, mapReady]);

  // ─── Focus a specific record ─────────────────────────────────────────────────
  useEffect(() => {
    if (!focusedRecordId || !mapInstanceRef.current) return;
    const entry = markerMapRef.current.get(focusedRecordId);
    if (entry && mapInstanceRef.current) {
      try {
        const targetZoom = Math.max(mapInstanceRef.current.getZoom ? mapInstanceRef.current.getZoom() : 14, 14);
        mapInstanceRef.current.setView(entry.coords, targetZoom, { animate: false });
        setTimeout(() => {
          if (
            mapInstanceRef.current &&
            entry.marker &&
            (entry.marker as any)._map &&
            (entry.marker as any)._icon
          ) {
            try {
              entry.marker.openPopup();
            } catch (popupErr) {
              console.warn('Marker popup open notice:', popupErr);
            }
          }
        }, 80);
      } catch (err) {
        console.warn('Map focus record notice:', err);
      }
    }
  }, [focusedRecordId]);

  const resolvedCount = records.filter((r) => resolveCoordinates(r) !== null).length;

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-tactical-card select-none isolate z-0 ${className}`}>
      {/* HUD — top left: Map Info */}
      <div className="absolute top-3 left-3 z-[400] flex items-center space-x-2 bg-slate-50/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-sans shadow-lg pointer-events-none">
        <Mountain className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-slate-100 font-bold uppercase tracking-wider">
          {GOOGLE_TILE_CONFIGS[activeLayer].label}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-emerald-400 font-bold">{resolvedCount} MAPPED</span>
        {records.length > resolvedCount && (
          <>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-semibold">{records.length - resolvedCount} UNMAPPED</span>
          </>
        )}
      </div>

      {/* HUD — top right: Map Layer Switcher + Live Status */}
      <div className="absolute top-3 right-3 z-[400] flex items-center space-x-2">
        {/* Layer Switcher (Terrain, Satellite, Roadmap) */}
        <div className="flex items-center p-1 rounded-lg bg-slate-50/95 backdrop-blur-md border border-slate-200 shadow-xl font-sans text-[11px]">
          {(['terrain', 'satellite', 'roadmap'] as GoogleMapLayerType[]).map((layerKey) => {
            const cfg = GOOGLE_TILE_CONFIGS[layerKey];
            const Icon = cfg.icon;
            const isActive = activeLayer === layerKey;
            return (
              <button
                key={layerKey}
                type="button"
                onClick={() => setActiveLayer(layerKey)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Switch to ${cfg.label}`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{cfg.label.replace('Google ', '')}</span>
              </button>
            );
          })}
        </div>

        {/* Live Auto-Sync indicator */}
        {isLive && (
          <div className="flex items-center space-x-1.5 bg-slate-50/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-emerald-700/60 text-xs font-sans shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-radar-dot shadow-glow-emerald" />
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-bold hidden sm:inline">LIVE AUTO-SYNC</span>
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="ml-1 p-0.5 text-slate-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
              title="Automatic live sync active. Click to refresh now."
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* ── Responsive Directional Navigation Controls (D-Pad) ── */}
      <div className="absolute bottom-4 right-4 z-[400] bg-slate-50/90 backdrop-blur-md p-2 rounded-xl border border-slate-200 shadow-2xl flex flex-col items-center space-y-1 font-sans">
        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
          Pan &amp; Hold
        </div>

        {/* Pan North */}
        <button
          type="button"
          onMouseDown={() => startPan(0, -90)}
          onMouseUp={stopPan}
          onMouseLeave={stopPan}
          onTouchStart={() => startPan(0, -90)}
          onTouchEnd={stopPan}
          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-slate-200 hover:text-cyan-300 flex items-center justify-center transition-all active:scale-90"
          title="Pan North (Hold to scroll)"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        {/* Middle Row: West, Center, East */}
        <div className="flex items-center space-x-1">
          {/* Pan West */}
          <button
            type="button"
            onMouseDown={() => startPan(-90, 0)}
            onMouseUp={stopPan}
            onMouseLeave={stopPan}
            onTouchStart={() => startPan(-90, 0)}
            onTouchEnd={stopPan}
            className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-slate-200 hover:text-cyan-300 flex items-center justify-center transition-all active:scale-90"
            title="Pan West (Hold to scroll)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Reset / Center */}
          <button
            type="button"
            onClick={resetToCenter}
            className="w-7 h-7 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 flex items-center justify-center transition-all active:scale-90"
            title="Re-center / Fit theater bounds"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Pan East */}
          <button
            type="button"
            onMouseDown={() => startPan(90, 0)}
            onMouseUp={stopPan}
            onMouseLeave={stopPan}
            onTouchStart={() => startPan(90, 0)}
            onTouchEnd={stopPan}
            className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-slate-200 hover:text-cyan-300 flex items-center justify-center transition-all active:scale-90"
            title="Pan East (Hold to scroll)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Pan South */}
        <button
          type="button"
          onMouseDown={() => startPan(0, 90)}
          onMouseUp={stopPan}
          onMouseLeave={stopPan}
          onTouchStart={() => startPan(0, 90)}
          onTouchEnd={stopPan}
          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-cyan-950 border border-slate-200 hover:border-cyan-500 text-slate-200 hover:text-cyan-300 flex items-center justify-center transition-all active:scale-90"
          title="Pan South (Hold to scroll)"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Pick mode banner */}
      {pickMode && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[400] flex items-center space-x-2 bg-rose-950/90 border border-rose-600/80 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-sans animate-pulse shadow-lg font-bold">
          <Crosshair className="w-4 h-4 text-rose-400" />
          <span>CLICK MAP TO PIN COORD</span>
        </div>
      )}

      {/* Drag & Hold Tip */}
      <div className="absolute bottom-3 left-3 z-[400] hidden sm:flex items-center space-x-1.5 bg-slate-50/85 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-200 text-[10px] text-slate-400 font-sans pointer-events-none">
        <Hand className="w-3 h-3 text-cyan-400" />
        <span>Click &amp; hold to drag map in all directions</span>
      </div>

      {/* Map DOM container */}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}

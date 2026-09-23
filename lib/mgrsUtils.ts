import { RecordItem } from '@/types';
// @ts-ignore
import * as mgrsLib from 'mgrs';

const mgrsModule: any = (mgrsLib && (mgrsLib as any).default) ? (mgrsLib as any).default : mgrsLib;

// Preset areas with fallback GPS coordinates (Philippine tactical AOR & standard zones)
export const PRESET_AREA_COORDS: Record<string, [number, number]> = {
  // ── Tactical Sectors ──
  'Sector 1 Northern Corridor': [37.7885, -122.4072],
  'Sector 2 Southern Ridge': [37.7554, -122.4182],
  'Sector 3 Eastern Highway': [37.7758, -122.3925],
  'Sector 4 Western Perimeter': [37.769, -122.4467],
  'FOB Bravo': [37.7812, -122.415],
  'Central Command Hub': [37.7749, -122.4194],
  'Checkpoint Charlie': [37.7621, -122.435],
  'Outpost Alpha-9': [37.792, -122.428],

  // ── Philippine Operational AOR (Mindanao & Key Provinces) ──
  'Cotabato': [7.2236, 124.2464],
  'Cotabato City': [7.2236, 124.2464],
  'North Cotabato': [7.1500, 124.9500],
  'South Cotabato': [6.2500, 124.8500],
  'Maguindanao del Norte': [7.2050, 124.2600],
  'Maguindanao del Sur': [6.8850, 124.5800],
  'Maguindanao': [7.0500, 124.4000],
  'Quirino': [16.2900, 121.5800],
  'Sulu': [6.0000, 121.0000],
  'Patikul, Sulu': [6.0461, 121.0543],
  'Jolo, Sulu': [6.0528, 121.0022],
  'Jolo': [6.0528, 121.0022],
  'Basilan': [6.5667, 122.0333],
  'Isabela City': [6.7042, 121.9711],
  'Lamitan': [6.6167, 122.1333],
  'Tawi-Tawi': [5.1200, 119.9800],
  'Bongao': [5.0333, 119.7667],
  'Marawi': [8.0024, 124.2839],
  'Lanao del Sur': [7.9000, 124.3000],
  'Lanao del Norte': [8.0500, 123.9500],
  'Iligan': [8.2280, 124.2452],
  'Zamboanga': [6.9214, 122.0790],
  'Zamboanga City': [6.9214, 122.0790],
  'Zamboanga del Sur': [7.8500, 123.2500],
  'Zamboanga del Norte': [8.3500, 123.1000],
  'Zamboanga Sibugay': [7.7500, 122.7500],
  'Pagadian': [7.8250, 123.4370],
  'Sultan Kudarat': [6.5500, 124.4500],
  'Isulan': [6.6333, 124.6000],
  'Sarangani': [5.8800, 125.2800],
  'General Santos': [6.1164, 125.1716],
  'Davao': [7.1907, 125.4579],
  'Davao City': [7.1907, 125.4579],
  'Davao del Sur': [6.7500, 125.3500],
  'Davao del Norte': [7.5500, 125.7500],
  'Davao Oriental': [7.1500, 126.3500],
  'Davao de Oro': [7.5000, 126.0000],
  'Davao Occidental': [6.0500, 125.6500],
  'Bukidnon': [8.0500, 125.0500],
  'Malaybalay': [8.1575, 125.1278],
  'Cagayan de Oro': [8.4542, 124.6319],
  'Misamis Oriental': [8.5500, 124.7500],
  'Misamis Occidental': [8.3000, 123.7500],
  'Agusan del Norte': [9.0000, 125.5000],
  'Agusan del Sur': [8.5000, 125.8000],
  'Butuan': [8.9475, 125.5406],
  'Surigao del Norte': [9.7500, 125.5000],
  'Surigao del Sur': [8.8500, 126.1500],
  'Manila': [14.5995, 120.9842],
  'Quezon City': [14.6760, 121.0437],
  'Metro Manila (NCR)': [14.5995, 120.9842],
  'Cebu': [10.3157, 123.8854],
  'Iloilo': [10.7202, 122.5621],
  'Palawan': [9.8349, 118.7384],
  'Puerto Princesa': [9.7392, 118.7353],
  'Tacloban': [11.2444, 125.0039],
  'Baguio': [16.4023, 120.5960],
};

// ─── UTM PROJECTION CONSTANTS ────────────────────────────────────────────────
const _a  = 6378137.0;          // WGS-84 semi-major axis (m)
const _f  = 1 / 298.257223563;  // flattening
const _b  = _a * (1 - _f);      // semi-minor axis
const _e2 = 1 - (_b * _b) / (_a * _a); // eccentricity squared
const _k0 = 0.9996;             // UTM scale factor
const _E0 = 500000;             // false easting (m)

/** Convert WGS-84 lat/lng (degrees) to UTM easting/northing for given zone. */
function _latLngToUTM(lat: number, lng: number, zone: number): { E: number; N: number } {
  const phi = (lat * Math.PI) / 180;
  const lam = (lng * Math.PI) / 180;
  const lam0 = (((zone - 1) * 6 - 180 + 3) * Math.PI) / 180;

  const N1 = _a / Math.sqrt(1 - _e2 * Math.sin(phi) ** 2);
  const T  = Math.tan(phi) ** 2;
  const C  = (_e2 / (1 - _e2)) * Math.cos(phi) ** 2;
  const A  = Math.cos(phi) * (lam - lam0);

  const e4 = _e2 * _e2;
  const e6 = e4 * _e2;
  const M  = _a * (
    (1 - _e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi
    - (3 * _e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * phi)
    + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * phi)
    - (35 * e6 / 3072) * Math.sin(6 * phi)
  );

  const E = _k0 * N1 * (
    A
    + (1 - T + C) * A ** 3 / 6
    + (5 - 18 * T + T * T + 72 * C - 58 * (_e2 / (1 - _e2))) * A ** 5 / 120
  ) + _E0;

  const N_raw = _k0 * (
    M
    + N1 * Math.tan(phi) * (
      A ** 2 / 2
      + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24
      + (61 - 58 * T + T * T + 600 * C - 330 * (_e2 / (1 - _e2))) * A ** 6 / 720
    )
  );

  // Southern hemisphere: add false northing
  const N = lat < 0 ? N_raw + 10000000 : N_raw;
  return { E, N };
}

// MGRS 100 km square column letter sets (by zone mod 3)
const _COL_LETTERS = [
  'ABCDEFGH', // zone % 3 === 1
  'JKLMNPQR', // zone % 3 === 2
  'STUVWXYZ', // zone % 3 === 0
];
const _ROW_LETTERS_ODD  = 'ABCDEFGHJKLMNPQRSTUV'; // odd zones
const _ROW_LETTERS_EVEN = 'FGHJKLMNPQRSTUVABCDE'; // even zones

function _get100kLetters(zone: number, E: number, N: number): string {
  const colSet    = ((zone - 1) % 3);
  const colIdx    = Math.floor((E % 900000) / 100000); // 0-8
  const colLetter = _COL_LETTERS[colSet]?.[colIdx] ?? 'A';

  const rowLetters = (zone % 2 === 0) ? _ROW_LETTERS_EVEN : _ROW_LETTERS_ODD;
  const rowIdx     = Math.floor((N % 2000000) / 100000) % 20;
  const rowLetter  = rowLetters[rowIdx] ?? 'A';

  return colLetter + rowLetter;
}

/**
 * Cleans user MGRS input by stripping all whitespace and forcing uppercase.
 * Example: "18s uu 8362 1405" -> "18SUU83621405"
 */
export function cleanMGRS(userInput: string): string {
  if (!userInput || typeof userInput !== 'string') return '';
  return userInput.replace(/\s+/g, '').toUpperCase();
}

/**
 * Formats a raw compact MGRS string into standardized military visual groups:
 * e.g. "51NXH3761098655" -> "51N XH 37610 98655"
 */
export function formatMGRSDisplay(mgrsStr: string): string {
  const clean = cleanMGRS(mgrsStr);
  const match = clean.match(/^(\d{1,2}[C-X])([A-Z]{2})(\d{2,10})$/);
  if (!match) return mgrsStr.trim().toUpperCase();
  const gzd = match[1];
  const sq = match[2];
  const digits = match[3];
  const half = Math.floor(digits.length / 2);
  const easting = digits.slice(0, half);
  const northing = digits.slice(half);
  return `${gzd} ${sq} ${easting} ${northing}`;
}

/**
 * Encodes WGS-84 lat/lng to 10-digit MGRS (1-meter pinpoint precision).
 * Uses official standard MGRS library: mgrs.forward([lng, lat], 5)
 */
export function toMGRS(lat: number, lng: number): string {
  if (isNaN(lat) || isNaN(lng)) return 'UNKNOWN MGRS';
  if (lat < -80 || lat > 84) return 'POLE REGION';

  try {
    if (mgrsModule && typeof mgrsModule.forward === 'function') {
      // mgrs.forward expects [lng, lat], precision 5 produces 10-digit MGRS (1-meter precision)
      const raw = mgrsModule.forward([lng, lat], 5);
      return formatMGRSDisplay(raw);
    }
  } catch (err) {
    console.warn('mgrs.forward library call failed, using algorithmic fallback:', err);
  }

  let zone = Math.floor((lng + 180) / 6) + 1;
  if (zone > 60) zone = 60;

  const bandLetters = 'CDEFGHJKLMNPQRSTUVWX';
  const bandIdx     = Math.max(0, Math.min(Math.floor((lat + 80) / 8), bandLetters.length - 1));
  const bandLetter  = bandLetters[bandIdx];

  const { E, N } = _latLngToUTM(lat, lng, zone);
  const squareLetters = _get100kLetters(zone, E, N);

  const easting5  = Math.floor(E % 100000).toString().padStart(5, '0');
  const northing5 = Math.floor(N % 100000).toString().padStart(5, '0');

  return `${zone}${bandLetter} ${squareLetters} ${easting5} ${northing5}`;
}

/**
 * Converts MGRS string to [lat, lng] using official mgrs.toPoint library.
 * Cleans spaces and forces uppercase before conversion (e.g. "18s uu 8362 1405" -> "18SUU83621405").
 * mgrs.toPoint returns [lng, lat], which is mapped to [lat, lng] for Leaflet.
 */
export function parseMGRSToCoords(mgrsStr: string): [number, number] | null {
  if (!mgrsStr || typeof mgrsStr !== 'string') return null;

  // 1. Clean MGRS input (remove whitespace, uppercase)
  const cleaned = cleanMGRS(mgrsStr);
  if (!cleaned) return null;

  // 2. Primary: official standard mgrs library toPoint conversion
  try {
    if (mgrsModule && typeof mgrsModule.toPoint === 'function') {
      // mgrs.toPoint returns [longitude, latitude]
      const result = mgrsModule.toPoint(cleaned);
      if (Array.isArray(result) && result.length >= 2) {
        const lng = Number(result[0]);
        const lat = Number(result[1]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
        }
      }
    }
  } catch (err) {
    // Falls through to algorithmic fallback if library throws syntax error
  }

  // 3. Algorithmic Fallback parser
  const match = cleaned.match(/^(\d{1,2})([C-X])([A-Z]{2})(\d{4,10})$/);
  if (match) {
    const zone = parseInt(match[1], 10);
    const bandLetter = match[2];
    const digits = match[4];
    if (zone >= 1 && zone <= 60) {
      const centerLng = (zone - 1) * 6 - 180 + 3;
      const bandLetters = 'CDEFGHJKLMNPQRSTUVWX';
      const bandIndex = bandLetters.indexOf(bandLetter);
      if (bandIndex !== -1) {
        const baseLat = -80 + bandIndex * 8 + 4;
        const half = Math.floor(digits.length / 2);
        const scale = Math.pow(10, half);
        const lngOffset = ((parseInt(digits.slice(0, half), 10) / scale) - 0.5) * 4.0;
        const latOffset = ((parseInt(digits.slice(half), 10) / scale) - 0.5) * 4.0;
        return [Number((baseLat + latOffset).toFixed(6)), Number((centerLng + lngOffset).toFixed(6))];
      }
    }
  }

  return null;
}

/**
 * Resolves coordinates for any record, checking lat/lng, MGRS metadata, or preset location names.
 */
export function resolveCoordinates(record: RecordItem): [number, number] | null {
  // 1. MGRS in metadata (primary tactical precision)
  const mgrsCandidate =
    record.metadata?.mgrs ||
    record.metadata?.grid_ref ||
    (record.code && record.code.includes('MGRS') ? record.code : null);
  if (mgrsCandidate) {
    const parsed = parseMGRSToCoords(String(mgrsCandidate));
    if (parsed) return parsed;
  }

  // 2. Direct numeric coordinates
  const lat = Number(record.lat);
  const lng = Number(record.lng);
  if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
    return [lat, lng];
  }

  // 3. Location name lookup (Philippine provinces and military sectors)
  if (record.location_name) {
    for (const [areaName, coords] of Object.entries(PRESET_AREA_COORDS)) {
      if (record.location_name.toLowerCase().includes(areaName.toLowerCase())) {
        return coords;
      }
    }
  }

  return null;
}

/**
 * Formats Zulu DTG (e.g. 150745Z SEP 26)
 */
export function toZuluDTG(isoStr?: string): string {
  const d = isoStr ? new Date(isoStr) : new Date();
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const mon = months[d.getUTCMonth()] || 'SEP';
  const yr = String(d.getUTCFullYear()).slice(-2);
  return `${dd}${hh}${mm}Z ${mon} ${yr}`;
}

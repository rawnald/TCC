export type CMOTab = 'rido' | 'piags' | 'cmo_activities';

export type RidoStatus =
  | 'Active'
  | 'High Tension'
  | 'Under Mediation'
  | 'Settled / Reconciled'
  | 'Dormant';

export interface RidoPersonality {
  name: string;
  clan_affiliation: string;
  role_title?: string;
  contact_number?: string;
  notes?: string;
}

export interface RidoRecord {
  id: string;
  case_code: string;
  feuding_parties: string; // e.g. "Sula Family vs Pendatun Clan"
  party_a: string;
  party_a_personalities?: string;
  party_a_affiliation?: string;
  party_a_mgrs?: string;
  party_a_lat?: number;
  party_a_lng?: number;
  party_b: string;
  party_b_personalities?: string;
  party_b_affiliation?: string;
  party_b_mgrs?: string;
  party_b_lat?: number;
  party_b_lng?: number;
  personalities_involved: string; // Key leaders, combatants, victims
  province: string;
  municipality: string;
  barangay: string;
  purok_sitio?: string;
  address: string;
  mgrs: string;
  lat: number;
  lng: number;
  root_cause: string;
  root_cause_other?: string;
  status: RidoStatus;
  mediating_agency: string;
  lead_mediator?: string;
  fatalities_count: number;
  wounded_count: number;
  displaced_families: number;
  narrative_history?: string;
  settlement_terms?: string;
  created_at: string;
  updated_at?: string;
}

export interface PIAGLocationRecord {
  id: string;
  group_name: string;
  commander_leader: string;
  affiliated_politician_faction?: string;
  estimated_strength: string;
  firearms_inventory?: string;
  total_est_firearms?: string;
  province: string;
  municipality: string;
  barangay: string;
  purok_sitio?: string;
  address?: string;
  mgrs: string;
  lat: number;
  lng: number;
  status: 'Active' | 'Monitored' | 'Disbanded' | 'Dormant';
  threat_level?: 'critical' | 'high' | 'medium' | 'low';
  notes?: string;
  remarks?: string;
  created_at: string;
  updated_at?: string;
}

export interface CMOActivityRecord {
  id: string;
  activity_title: string;
  activity_type: string; // Medical Mission, Youth Leadership, Community Dialogue, Relief, etc.
  target_community: string;
  province: string;
  municipality: string;
  barangay: string;
  address?: string;
  mgrs?: string;
  lat?: number;
  lng?: number;
  implementing_unit: string;
  stakeholders_partners?: string;
  beneficiaries_count: number;
  activity_date: string;
  status: 'Planned' | 'Ongoing' | 'Completed';
  remarks?: string;
  created_at: string;
  updated_at?: string;
}


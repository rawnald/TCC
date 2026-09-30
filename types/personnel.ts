export type MilitaryRank =
  | 'PVT'
  | 'PFC'
  | 'CPL'
  | 'SGT'
  | 'SSG'
  | 'TSg'
  | 'MSgt'
  | 'SMSgt'
  | 'CMSgt'
  | '1SG'
  | 'SGM'
  | 'CSM'
  | '2LT'
  | '1LT'
  | 'CPT'
  | 'MAJ'
  | 'LTC'
  | 'COL'
  | 'BGEN'
  | 'MGEN'
  | 'LTGEN'
  | 'GEN'
  | 'Chr'
  | string;

export type AFPOSBranch =
  | 'INF'
  | 'FA'
  | 'CAV'
  | 'CE'
  | 'MI'
  | 'SC'
  | 'FS'
  | 'OS'
  | 'QMS'
  | 'AGS'
  | 'CMO'
  | 'N/A'
  | string;

export type PersonnelStatus =
  | 'MWB'
  | 'Passes'
  | 'Mission'
  | 'Schooling'
  | 'RRST'
  | 'DS'
  | string;

export type PersonnelRemarks =
  | 'Active'
  | 'Inactive'
  | 'Discharge'
  | 'AWOL'
  | 'Honorable Discharge'
  | string;

export interface UploadedDocumentFile {
  file_name: string;
  file_type: string; // 'application/pdf', 'image/jpeg', 'image/png', etc.
  file_size_kb?: number;
  file_data?: string; // Base64 data URL or Storage URL
  upload_date?: string;
}

export interface MilitaryProfile {
  id: string;
  unit_office: string; // From force_units or custom "Others"
  rank: MilitaryRank;
  last_name: string;
  first_name: string;
  middle_name?: string;
  serial_number: string;
  afpos: AFPOSBranch;
  designation: string;
  address?: string;
  contact_number?: string;
  mobile_number?: string;
  status: PersonnelStatus;
  status_other?: string;
  remarks: PersonnelRemarks;
  remarks_other?: string;
  security_clearance_file?: UploadedDocumentFile | null;
  soi_file?: UploadedDocumentFile | null;
  picture_url?: string;
  created_at?: string;
  updated_at?: string;
  // Legacy / extra compat fields
  full_name?: string;
  callsign?: string;
  assigned_unit?: string;
  current_location?: string;
  duty_status?: string;
  combat_readiness?: string;
  security_clearance?: string;
  blood_type?: string;
  mos_afsc?: string;
  position_role?: string;
  mgrs_grid?: string;
  attached_files?: any[];
  status_logs?: any[];
}

export const isUUID = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export type PersonnelTab = 'dlt' | 'personnel_profile';

export type DLTStatus = 'Organic' | 'Opcon';

export type BranchOfService = 'PA' | 'PAF' | 'PN' | 'PN(M)';

export interface DLTRecord {
  id: string;
  rank: string;
  name: string;
  serial_number: string;
  afpos: string;
  branch_of_service: BranchOfService | string;
  designation: string;
  unit_id?: string;
  unit_name: string;
  location: string;
  mgrs?: string;
  contact_number?: string;
  officers_count: number;
  ep_count: number;
  caa_count: number;
  ce_count: number;
  date_assumption: string;
  status: DLTStatus | string;
  created_at?: string;
  updated_at?: string;
}

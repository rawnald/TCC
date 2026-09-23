export type UserRole = 'admin' | 'operator' | 'viewer';

export type RecordCategory =
  | 'personnel'
  | 'units'
  | 'locations'
  | 'incidents'
  | 'tasks'
  | 'equipment'
  | 'reports'
  | 'documents';

export type OperationalCellType =
  | 'operation_cell'
  | 'intelligence_cell'
  | 'cmo_cell'
  | 'personnel_cell'
  | 'fire_support_cell'
  | 'io_cell'
  | 'c4s_cell'
  | 'logistics_cell';

export type RecordStatus = 'active' | 'pending' | 'closed' | 'archived';

export type RecordPriority = 'low' | 'medium' | 'high' | 'critical';

export interface RecordItem {
  id: string;
  code: string;
  title: string;
  category: RecordCategory;
  description: string;
  status: RecordStatus;
  priority: RecordPriority;
  lat: number;
  lng: number;
  location_name: string;
  metadata: Record<string, any>;
  created_by?: string;
  created_by_email?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  record_id?: string;
  actor_id?: string;
  actor_email: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SNAPSHOT_EXPORT';
  category?: string;
  record_title?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  callsign: string;
  role: UserRole;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SnapshotPayload {
  timestamp: string;
  version: string;
  triggered_by: string;
  total_records: number;
  data: RecordItem[];
}

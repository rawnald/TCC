-- ==============================================================================
-- TACTICAL COMMAND DASHBOARD - MASTER DATABASE SCHEMA
-- Target: Supabase PostgreSQL (SQL Editor)
-- Instructions: Run this entire script in your Supabase project SQL Editor.
-- It creates all required tables, columns, indexes, RLS policies, and enables Realtime sync.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Define Custom Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'operator', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE record_category AS ENUM (
        'personnel',
        'units',
        'locations',
        'incidents',
        'tasks',
        'equipment',
        'reports',
        'documents'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE record_status AS ENUM ('active', 'pending', 'closed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE record_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. Profiles Table (Linked to Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    callsign TEXT,
    role user_role NOT NULL DEFAULT 'operator',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles access" ON public.profiles;
CREATE POLICY "Public profiles access" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 4. Unified Records Table (Powers CRUD Modules & Global Map Markers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category record_category NOT NULL DEFAULT 'incidents',
    title TEXT NOT NULL,
    code TEXT,
    description TEXT,
    status record_status NOT NULL DEFAULT 'active',
    priority record_priority NOT NULL DEFAULT 'medium',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    location_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_records_category ON public.records(category);
CREATE INDEX IF NOT EXISTS idx_records_status ON public.records(status);
CREATE INDEX IF NOT EXISTS idx_records_priority ON public.records(priority);
CREATE INDEX IF NOT EXISTS idx_records_coordinates ON public.records(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on records" ON public.records;
CREATE POLICY "Allow all operations on records" ON public.records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. Audit & Activity Logs Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID REFERENCES public.records(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    category TEXT,
    record_title TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow all operations on audit_logs" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 6. Incidents Table (Operation Cell COP & Threat Incidents)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT DEFAULT '',
    incident_number TEXT,
    title TEXT NOT NULL,
    operation_type TEXT NOT NULL DEFAULT 'Combat Ops',
    incident_type TEXT NOT NULL DEFAULT 'Armed Encounter',
    severity TEXT NOT NULL DEFAULT 'medium',
    priority TEXT NOT NULL DEFAULT 'high',
    status TEXT NOT NULL DEFAULT 'active',
    area TEXT DEFAULT '',
    location_name TEXT NOT NULL DEFAULT '',
    mgrs TEXT NOT NULL DEFAULT '',
    lat DOUBLE PRECISION NOT NULL DEFAULT 6.95,
    lng DOUBLE PRECISION NOT NULL DEFAULT 124.47,
    dtg TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reporting_unit TEXT DEFAULT '601st Bde TOC',
    narrative TEXT DEFAULT '',
    description TEXT DEFAULT '',
    friendly_casualties INTEGER DEFAULT 0,
    enemy_casualties INTEGER DEFAULT 0,
    civilian_casualties INTEGER DEFAULT 0,
    weapons_recovered INTEGER DEFAULT 0,
    responding_units JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_mgrs ON public.incidents(mgrs);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on incidents" ON public.incidents;
CREATE POLICY "Allow all operations on incidents" ON public.incidents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 7. Force Units Table (Force Status Roster)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.force_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_name TEXT DEFAULT '',
    callsign TEXT DEFAULT '',
    battalion TEXT DEFAULT '',
    brigade TEXT DEFAULT '',
    commander TEXT DEFAULT '',
    contact_number TEXT DEFAULT '',
    readiness TEXT NOT NULL DEFAULT 'combat_ready',
    area TEXT DEFAULT '',
    personnel_count INTEGER DEFAULT 0,
    afp_officers INTEGER DEFAULT 0,
    afp_enlisted INTEGER DEFAULT 0,
    caa INTEGER DEFAULT 0,
    wavs_tavs INTEGER DEFAULT 0,
    air_assets INTEGER DEFAULT 0,
    vehicle INTEGER DEFAULT 0,
    naval_assets INTEGER DEFAULT 0,
    isr_asset INTEGER DEFAULT 0,
    artillery_asset INTEGER DEFAULT 0,
    current_location TEXT DEFAULT '',
    mgrs TEXT DEFAULT '',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    assigned_mission TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_force_units_unit_name ON public.force_units(unit_name);
CREATE INDEX IF NOT EXISTS idx_force_units_readiness ON public.force_units(readiness);

ALTER TABLE public.force_units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on force_units" ON public.force_units;
CREATE POLICY "Allow all operations on force_units" ON public.force_units FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 8. Unit Taskings Table (Operation Directive Taskings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.unit_taskings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_unit_id TEXT NOT NULL DEFAULT '',
    assigned_unit_label TEXT NOT NULL DEFAULT '',
    directive_details TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'medium',
    mgrs TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unit_taskings_mgrs ON public.unit_taskings(mgrs);
CREATE INDEX IF NOT EXISTS idx_unit_taskings_status ON public.unit_taskings(status);

ALTER TABLE public.unit_taskings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on unit_taskings" ON public.unit_taskings;
CREATE POLICY "Allow all operations on unit_taskings" ON public.unit_taskings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 9. Movement Deployments Table (Convoy & Patrol Tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.movement_deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id TEXT,
    unit_name TEXT,
    unit_people TEXT DEFAULT '',
    directive_details TEXT DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'medium',
    movement_type TEXT NOT NULL DEFAULT 'patrol',
    origin TEXT DEFAULT '',
    origin_mgrs TEXT DEFAULT '',
    destination TEXT DEFAULT '',
    destination_mgrs TEXT DEFAULT '',
    location_from TEXT DEFAULT '',
    location_to TEXT DEFAULT '',
    mode_of_movement TEXT DEFAULT 'Land / Wheeled',
    departure_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    movement_date DATE DEFAULT CURRENT_DATE,
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'planned',
    vehicle_count INTEGER DEFAULT 1,
    personnel_count INTEGER DEFAULT 1,
    route_details TEXT DEFAULT '',
    remarks TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.movement_deployments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on movement_deployments" ON public.movement_deployments;
CREATE POLICY "Allow all operations on movement_deployments" ON public.movement_deployments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 10. Spot Reports Table (Tactical Incidents & Field Reports)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.spot_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_number TEXT DEFAULT '',
    event TEXT DEFAULT '',
    incident_type TEXT DEFAULT 'Incident',
    dtg TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    incident_date DATE DEFAULT CURRENT_DATE,
    mgrs TEXT NOT NULL DEFAULT '',
    location TEXT DEFAULT '',
    location_name TEXT NOT NULL DEFAULT '',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    unit_involved TEXT DEFAULT '',
    reporting_unit TEXT DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    narrative TEXT DEFAULT '',
    actions_taken TEXT DEFAULT '',
    results TEXT DEFAULT '',
    casualties INTEGER DEFAULT 0,
    enemy_killed INTEGER DEFAULT 0,
    friendly_wounded INTEGER DEFAULT 0,
    file_name TEXT,
    file_size TEXT,
    file_type TEXT,
    file_data TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spot_reports_mgrs ON public.spot_reports(mgrs);

ALTER TABLE public.spot_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on spot_reports" ON public.spot_reports;
CREATE POLICY "Allow all operations on spot_reports" ON public.spot_reports FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 11. Operational Directives Table (Operations Documents)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.operational_directives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    directive_number TEXT NOT NULL,
    title TEXT NOT NULL,
    directive_type TEXT NOT NULL DEFAULT 'Command Directive',
    issuing_authority TEXT NOT NULL DEFAULT 'G3 Operations',
    target_units TEXT NOT NULL DEFAULT 'All Task Force Elements',
    priority TEXT NOT NULL DEFAULT 'high',
    classification TEXT NOT NULL DEFAULT 'SECRET',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location_aor TEXT DEFAULT '',
    narrative TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    file_name TEXT,
    file_size TEXT,
    file_type TEXT,
    file_data TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.operational_directives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on operational_directives" ON public.operational_directives;
CREATE POLICY "Allow all operations on operational_directives" ON public.operational_directives FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 12. Intel DIB Table (Daily Intelligence Bulletins)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.intel_dib (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dib_id TEXT DEFAULT '',
    bulletin_number TEXT DEFAULT '',
    title TEXT DEFAULT '',
    activity TEXT DEFAULT '',
    details TEXT DEFAULT '',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    datetime TIMESTAMPTZ DEFAULT NOW(),
    source TEXT NOT NULL DEFAULT 'Human Intelligence (HUMINT)',
    threat_level TEXT NOT NULL DEFAULT 'HIGH',
    classification TEXT NOT NULL DEFAULT 'SECRET',
    threat_actor TEXT NOT NULL DEFAULT 'BIFF',
    threat_group TEXT DEFAULT 'BIFF',
    threat_group_other TEXT DEFAULT '',
    personality_victim TEXT DEFAULT '',
    motive TEXT DEFAULT '',
    source_evaluation TEXT DEFAULT 'B-2',
    type TEXT DEFAULT 'Threat Advisory',
    province TEXT NOT NULL DEFAULT 'Maguindanao del Sur',
    municipality TEXT DEFAULT '',
    barangay TEXT DEFAULT '',
    purok_sitio TEXT DEFAULT '',
    address TEXT DEFAULT '',
    target_area TEXT NOT NULL DEFAULT '',
    mgrs TEXT NOT NULL DEFAULT '',
    lat DOUBLE PRECISION DEFAULT 6.95,
    lng DOUBLE PRECISION DEFAULT 124.47,
    content TEXT NOT NULL DEFAULT '',
    implications TEXT DEFAULT '',
    recommended_action TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_dib_mgrs ON public.intel_dib(mgrs);

ALTER TABLE public.intel_dib ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on intel_dib" ON public.intel_dib;
CREATE POLICY "Allow all operations on intel_dib" ON public.intel_dib FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 13. Intel Enemy Locations Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.intel_enemy_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threat_group TEXT NOT NULL DEFAULT 'BIFF',
    leader TEXT DEFAULT '',
    strength INTEGER DEFAULT 0,
    firearms_count INTEGER DEFAULT 0,
    province TEXT NOT NULL DEFAULT 'Maguindanao del Sur',
    municipality TEXT DEFAULT '',
    barangay TEXT DEFAULT '',
    purok_sitio TEXT DEFAULT '',
    location_name TEXT NOT NULL DEFAULT '',
    mgrs TEXT NOT NULL DEFAULT '',
    lat DOUBLE PRECISION DEFAULT 6.95,
    lng DOUBLE PRECISION DEFAULT 124.47,
    status TEXT NOT NULL DEFAULT 'Active Camp',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.intel_enemy_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on intel_enemy_locations" ON public.intel_enemy_locations;
CREATE POLICY "Allow all operations on intel_enemy_locations" ON public.intel_enemy_locations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 14. Enemy Profiles Table (HVI & Non-HVI Threat Subjects)
-- ==============================================================================
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

ALTER TABLE public.enemy_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on enemy_profiles" ON public.enemy_profiles;
CREATE POLICY "Allow all operations on enemy_profiles" ON public.enemy_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 15. Personnel Profiles Table (Friendly Forces Roster)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.personnel_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_office TEXT NOT NULL DEFAULT '',
    rank TEXT NOT NULL DEFAULT 'SGT',
    last_name TEXT NOT NULL DEFAULT '',
    first_name TEXT NOT NULL DEFAULT '',
    middle_name TEXT DEFAULT '',
    serial_number TEXT NOT NULL DEFAULT '',
    afpos TEXT NOT NULL DEFAULT 'INF',
    designation TEXT NOT NULL DEFAULT '',
    address TEXT DEFAULT '',
    contact_number TEXT DEFAULT '',
    mobile_number TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'MWB',
    status_other TEXT DEFAULT '',
    remarks TEXT NOT NULL DEFAULT 'Active',
    remarks_other TEXT DEFAULT '',
    security_clearance_file JSONB,
    soi_file JSONB,
    picture_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personnel_profiles_serial ON public.personnel_profiles(serial_number);

ALTER TABLE public.personnel_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on personnel_profiles" ON public.personnel_profiles;
CREATE POLICY "Allow all operations on personnel_profiles" ON public.personnel_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 16. CMO Rido Table (Feuding Clans & Reconciliation Radar)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cmo_rido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_code TEXT,
    feuding_parties TEXT,
    party_a TEXT NOT NULL,
    party_a_personalities TEXT,
    party_a_affiliation TEXT,
    party_a_mgrs TEXT,
    party_a_lat DOUBLE PRECISION,
    party_a_lng DOUBLE PRECISION,
    party_b TEXT NOT NULL,
    party_b_personalities TEXT,
    party_b_affiliation TEXT,
    party_b_mgrs TEXT,
    party_b_lat DOUBLE PRECISION,
    party_b_lng DOUBLE PRECISION,
    personalities_involved TEXT,
    province TEXT DEFAULT 'Maguindanao del Sur',
    municipality TEXT,
    barangay TEXT,
    purok_sitio TEXT,
    address TEXT,
    mgrs TEXT,
    lat DOUBLE PRECISION DEFAULT 6.95,
    lng DOUBLE PRECISION DEFAULT 124.47,
    root_cause TEXT DEFAULT 'Land Dispute',
    root_cause_other TEXT,
    status TEXT DEFAULT 'Active',
    mediating_agency TEXT DEFAULT '',
    lead_mediator TEXT DEFAULT '',
    fatalities_count INTEGER DEFAULT 0,
    wounded_count INTEGER DEFAULT 0,
    displaced_families INTEGER DEFAULT 0,
    narrative_history TEXT,
    settlement_terms TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cmo_rido ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on cmo_rido" ON public.cmo_rido;
CREATE POLICY "Allow all operations on cmo_rido" ON public.cmo_rido FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 17. CMO PIAGs Table (Political Armed Groups / Bases)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cmo_piags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name TEXT NOT NULL,
    commander TEXT,
    commander_leader TEXT DEFAULT '',
    affiliation TEXT,
    affiliated_politician_faction TEXT DEFAULT '',
    strength INTEGER DEFAULT 0,
    estimated_strength INTEGER DEFAULT 0,
    firearms_count INTEGER DEFAULT 0,
    total_est_firearms INTEGER DEFAULT 0,
    firearms_inventory TEXT DEFAULT '',
    province TEXT DEFAULT 'Maguindanao del Sur',
    municipality TEXT,
    barangay TEXT,
    purok_sitio TEXT,
    location_name TEXT,
    address TEXT DEFAULT '',
    mgrs TEXT,
    lat DOUBLE PRECISION DEFAULT 6.95,
    lng DOUBLE PRECISION DEFAULT 124.47,
    status TEXT DEFAULT 'Active Base',
    threat_level TEXT DEFAULT 'Moderate',
    notes TEXT,
    remarks TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cmo_piags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on cmo_piags" ON public.cmo_piags;
CREATE POLICY "Allow all operations on cmo_piags" ON public.cmo_piags FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 18. CMO Activities Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cmo_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_name TEXT NOT NULL,
    activity_type TEXT NOT NULL DEFAULT 'Community Outreach',
    implementing_unit TEXT DEFAULT '6CMOBn',
    stakeholders_partners TEXT DEFAULT '',
    beneficiaries_count INTEGER DEFAULT 0,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location_name TEXT DEFAULT '',
    mgrs TEXT DEFAULT '',
    lat DOUBLE PRECISION DEFAULT 6.95,
    lng DOUBLE PRECISION DEFAULT 124.47,
    status TEXT NOT NULL DEFAULT 'Completed',
    remarks TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cmo_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on cmo_activities" ON public.cmo_activities;
CREATE POLICY "Allow all operations on cmo_activities" ON public.cmo_activities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 19. Enable Supabase Realtime Publication for Live WebSockets
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.records;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.force_units;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_taskings;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.movement_deployments;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.spot_reports;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_directives;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.intel_dib;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.intel_enemy_locations;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enemy_profiles;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.personnel_profiles;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cmo_rido;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cmo_piags;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cmo_activities;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- TACTICAL COMMAND DASHBOARD - SUPABASE POSTGRESQL SCHEMA WITH RLS & RBAC
-- Instructions: Copy and paste this script directly into Supabase SQL Editor
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

-- 3. Profiles Table (Linked to Supabase Auth Users)
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

-- 4. Unified Records Table (Powers all 8 CRUD modules & Map Markers)
CREATE TABLE IF NOT EXISTS public.records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category record_category NOT NULL DEFAULT 'incidents',
    title TEXT NOT NULL,
    code TEXT, -- Tactical code, e.g., INC-102, PER-044, EQ-901
    description TEXT,
    status record_status NOT NULL DEFAULT 'active',
    priority record_priority NOT NULL DEFAULT 'medium',
    
    -- Geographical coordinates for Leaflet + OpenStreetMap
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    location_name TEXT,
    
    -- Flexible metadata for module-specific details (JSONB)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Authorship and timestamps
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast spatial and status querying
CREATE INDEX IF NOT EXISTS idx_records_category ON public.records(category);
CREATE INDEX IF NOT EXISTS idx_records_status ON public.records(status);
CREATE INDEX IF NOT EXISTS idx_records_priority ON public.records(priority);
CREATE INDEX IF NOT EXISTS idx_records_coordinates ON public.records(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- 5. Audit & Activity Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID REFERENCES public.records(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'SNAPSHOT_EXPORT'
    category TEXT,
    record_title TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 6. Helper Security Functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_operator_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'operator')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 7. Automatic Profile Provisioning Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
    user_count INT;
    assigned_role public.user_role;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    IF user_count = 0 THEN
        assigned_role := 'admin'::public.user_role;
    ELSIF NEW.raw_user_meta_data->>'role' = 'admin' THEN
        assigned_role := 'admin'::public.user_role;
    ELSIF NEW.raw_user_meta_data->>'role' = 'viewer' THEN
        assigned_role := 'viewer'::public.user_role;
    ELSE
        assigned_role := 'operator'::public.user_role;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, callsign, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, 'operator@command.local'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'operator'), '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'callsign', 'OPERATOR-' || SUBSTRING(NEW.id::text, 1, 4)),
        assigned_role
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        callsign = EXCLUDED.callsign;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins have full profile access"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Records Policies
CREATE POLICY "Records readable by authenticated users"
    ON public.records FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Operators and Admins can insert records"
    ON public.records FOR INSERT
    TO authenticated
    WITH CHECK (public.is_operator_or_admin());

-- Optional permissive policy for instant local development and direct TOC operations
CREATE POLICY "Allow public insert for operational records"
    ON public.records FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Operators can update records"
    ON public.records FOR UPDATE
    TO authenticated
    USING (public.is_operator_or_admin())
    WITH CHECK (public.is_operator_or_admin());

CREATE POLICY "Only Admins can delete records"
    ON public.records FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- Audit Logs Policies
CREATE POLICY "Audit logs readable by Operators and Admins"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_operator_or_admin());

CREATE POLICY "Audit logs insertable by system/authenticated"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 9. Sample Seed Data (For Immediate Demonstration in Supabase)
INSERT INTO public.records (code, title, category, description, status, priority, lat, lng, location_name, metadata)
VALUES
    ('INC-001', 'Structural Anomaly Detected', 'incidents', 'Sensor array reported seismic tremor near substation alpha.', 'active', 'high', 37.7749, -122.4194, 'Downtown Sector 4', '{"severity": "High", "units_assigned": 2}'::jsonb),
    ('PER-104', 'Lt. Commander Sarah Chen', 'personnel', 'Commanding lead for Tactical Rapid Response Unit.', 'active', 'medium', 37.7833, -122.4167, 'Central Operations Hub', '{"rank": "Lt. Commander", "badge": "TR-104", "phone": "+1-555-0192"}'::jsonb),
    ('UNT-012', 'Echo Reconnaissance Unit', 'units', 'Mobile mobile recon patrol on western perimeter monitoring.', 'active', 'high', 37.7690, -122.4467, 'Western Perimeter Gate', '{"strength": 8, "vehicle": "Tactical Light Armored 2"}'::jsonb),
    ('LOC-042', 'Forward Operations Base Beta', 'locations', 'Secondary staging zone and drone relay tower.', 'active', 'low', 37.7580, -122.4120, 'Southern Ridge Base', '{"capacity": 45, "power_status": "Auxiliary"}'::jsonb),
    ('TSK-208', 'Perimeter Drone Calibration', 'tasks', 'Perform scheduled telemetry check on surveillance drones.', 'pending', 'medium', 37.7600, -122.4300, 'Substation Gamma', '{"due_date": "2026-09-18", "assignee": "Tech Sgt. Rodriguez"}'::jsonb),
    ('EQP-880', 'Mobile Satellite Uplink Alpha', 'equipment', 'High-bandwidth encrypted telemetry terminal.', 'active', 'medium', 37.7850, -122.4080, 'HQ Comms Room', '{"serial": "SAT-99201", "condition": "Optimal"}'::jsonb),
    ('REP-055', 'Weekly Incident Assessment Q3', 'reports', 'Consolidated situational report covering all tactical sectors.', 'closed', 'low', 37.7720, -122.4250, 'Command Archive', '{"author": "Intelligence Officer Vance", "pages": 14}'::jsonb),
    ('DOC-312', 'Emergency Contingency Protocol v4.2', 'documents', 'Standard operating procedures for blackout & communications loss.', 'active', 'critical', 37.7700, -122.4150, 'Secure Vault', '{"classification": "Classified-Internal", "version": "4.2"}'::jsonb)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 10. Force Units Table (Forces Status / Unit Hierarchy)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.force_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battalion TEXT NOT NULL,
    brigade TEXT NOT NULL,
    area TEXT,
    mgrs TEXT,
    logo_url TEXT,
    afp_officers INT DEFAULT 0,
    afp_enlisted INT DEFAULT 0,
    caa INT DEFAULT 0,
    wavs_tavs INT DEFAULT 0,
    air_assets INT DEFAULT 0,
    vehicle INT DEFAULT 0,
    naval_assets INT DEFAULT 0,
    isr_asset INT DEFAULT 0,
    artillery_asset INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.force_units ADD COLUMN IF NOT EXISTS mgrs TEXT;
ALTER TABLE public.force_units ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE public.force_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on force_units"
    ON public.force_units FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 11. Unit Taskings Table (Tactical Directives — Uses MGRS, NO Lat/Long Data)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.unit_taskings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_unit_id TEXT NOT NULL,
    assigned_unit_label TEXT NOT NULL,
    directive_details TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    mgrs TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    task_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure any legacy or mistakenly created lat/long columns are dropped from Supabase
ALTER TABLE public.unit_taskings DROP COLUMN IF EXISTS lat;
ALTER TABLE public.unit_taskings DROP COLUMN IF EXISTS lng;
ALTER TABLE public.unit_taskings DROP COLUMN IF EXISTS latitude;
ALTER TABLE public.unit_taskings DROP COLUMN IF EXISTS longitude;
ALTER TABLE public.unit_taskings ADD COLUMN IF NOT EXISTS mgrs TEXT DEFAULT '';

ALTER TABLE public.unit_taskings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on unit_taskings"
    ON public.unit_taskings FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 12. Movement & Deployment Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.movement_deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_people TEXT NOT NULL,
    directive_details TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    location_from TEXT NOT NULL,
    location_to TEXT NOT NULL,
    status TEXT DEFAULT 'in_transit',
    movement_date DATE DEFAULT CURRENT_DATE,
    mode_of_movement TEXT DEFAULT 'Land',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.movement_deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on movement_deployments"
    ON public.movement_deployments FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 13. Tactical Spot Reports (SPOTREP) Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.spot_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event TEXT NOT NULL,
    incident_date DATE DEFAULT CURRENT_DATE,
    location TEXT NOT NULL,
    unit_involved TEXT NOT NULL,
    narrative TEXT NOT NULL,
    results TEXT NOT NULL,
    file_name TEXT,
    file_size BIGINT,
    file_type TEXT,
    file_data TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.spot_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on spot_reports"
    ON public.spot_reports FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 14. Daily Intelligence Bulletin (DIB) Table
-- G2 Intelligence Cell — DIB Reports (No localStorage, Direct Supabase Ingestion)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.intel_dib (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    dib_id TEXT NOT NULL UNIQUE,
    activity TEXT NOT NULL,
    details TEXT DEFAULT '',
    datetime TEXT NOT NULL,
    mgrs TEXT NOT NULL,
    threat_group TEXT NOT NULL CHECK (
        threat_group IN ('PIAGs', 'DIHG', 'PAGs', 'BIFF', 'CRIMINALITY', 'Armed Lawless Element', 'Others')
    ),
    threat_group_other TEXT DEFAULT '',
    personality_victim TEXT NOT NULL DEFAULT 'N/A',
    motive TEXT NOT NULL CHECK (
        motive IN ('Personal Grudge', 'Land Conflict', 'Rido', 'Drug Related', 'Robbery', 'Carnapping', 'Family Feud', 'Undetermined')
    ),
    source_evaluation TEXT NOT NULL DEFAULT 'Direct Field Report',
    type TEXT NOT NULL DEFAULT 'Violent' CHECK (
        type IN ('Violent', 'Non-Violent')
    ),
    address TEXT NOT NULL,
    province TEXT DEFAULT '',
    municipality TEXT DEFAULT '',
    barangay TEXT DEFAULT '',
    purok_sitio TEXT DEFAULT '',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for fast search and filtering
CREATE INDEX IF NOT EXISTS idx_intel_dib_dib_id ON public.intel_dib(dib_id);
CREATE INDEX IF NOT EXISTS idx_intel_dib_type ON public.intel_dib(type);
CREATE INDEX IF NOT EXISTS idx_intel_dib_threat_group ON public.intel_dib(threat_group);
CREATE INDEX IF NOT EXISTS idx_intel_dib_motive ON public.intel_dib(motive);
CREATE INDEX IF NOT EXISTS idx_intel_dib_created_at ON public.intel_dib(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intel_dib_mgrs ON public.intel_dib(mgrs);

-- Enable Row Level Security (RLS)
ALTER TABLE public.intel_dib ENABLE ROW LEVEL SECURITY;

-- Allow read, write, update, delete for anonymous and authenticated users
CREATE POLICY "Allow all operations on intel_dib"
    ON public.intel_dib FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Enable Realtime replication for instant dashboard live updates
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.intel_dib;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 15. Operational Directives (Directives) Table
-- Operational Cell // Mission Directives, Task Orders, OPORD, FRAGO, and ROE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.operational_directives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    directive_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    directive_type TEXT NOT NULL DEFAULT 'Command Directive',
    issuing_authority TEXT NOT NULL,
    target_units TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'high',
    classification TEXT NOT NULL DEFAULT 'SECRET',
    effective_date DATE DEFAULT CURRENT_DATE,
    location_aor TEXT DEFAULT '',
    narrative TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    file_name TEXT,
    file_size BIGINT,
    file_type TEXT,
    file_data TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operational_directives_number ON public.operational_directives(directive_number);
CREATE INDEX IF NOT EXISTS idx_operational_directives_type ON public.operational_directives(directive_type);
CREATE INDEX IF NOT EXISTS idx_operational_directives_priority ON public.operational_directives(priority);
CREATE INDEX IF NOT EXISTS idx_operational_directives_status ON public.operational_directives(status);
CREATE INDEX IF NOT EXISTS idx_operational_directives_created_at ON public.operational_directives(created_at DESC);

ALTER TABLE public.operational_directives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on operational_directives"
    ON public.operational_directives FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_directives;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 16. Enemy Profiles Table
-- Intelligence Cell // Enemy Profiling Status, HVI/Non-HVI target profiles
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
    value TEXT NOT NULL DEFAULT 'HVI', -- 'HVI' | 'Non-HVI'
    psr TEXT DEFAULT '',
    latest_location_mgrs TEXT DEFAULT '',
    lat DOUBLE PRECISION DEFAULT 7.2236,
    lng DOUBLE PRECISION DEFAULT 124.2464,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enemy_profiles_true_name ON public.enemy_profiles(true_name);
CREATE INDEX IF NOT EXISTS idx_enemy_profiles_threat_group ON public.enemy_profiles(threat_group);
CREATE INDEX IF NOT EXISTS idx_enemy_profiles_value ON public.enemy_profiles(value);
CREATE INDEX IF NOT EXISTS idx_enemy_profiles_mgrs ON public.enemy_profiles(latest_location_mgrs);
CREATE INDEX IF NOT EXISTS idx_enemy_profiles_created_at ON public.enemy_profiles(created_at DESC);

ALTER TABLE public.enemy_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on enemy_profiles" ON public.enemy_profiles;
CREATE POLICY "Allow all operations on enemy_profiles"
    ON public.enemy_profiles FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enemy_profiles;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

NOTIFY pgrst, 'reload schema';





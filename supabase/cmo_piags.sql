-- ==============================================================================
-- SUPABASE MIGRATION: Dedicated PIAGs Locations Table (public.cmo_piags)
-- Separate Standalone SQL Table for Private Armed Groups (PIAGs) Surveillance
-- Tactical Command Dashboard — Civil-Military Operations (CMO) Cell
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Navigate to SQL Editor -> New Query
-- 3. Paste this entire script and click RUN
-- ==============================================================================

-- 1. Enable Required UUID & Cryptographic Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing view if any conflicting object exists
DROP VIEW IF EXISTS public.cmo_piags CASCADE;

-- 3. Create Dedicated Standalone Table for PIAGs Locations
CREATE TABLE IF NOT EXISTS public.cmo_piags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name TEXT NOT NULL,                                   -- e.g. MILF — 105th Base Command, MNLF — Lupah Sug Force
    commander_leader TEXT NOT NULL,                             -- e.g. Commander Jack / Ting Sinsuat
    affiliated_politician_faction TEXT,                         -- Political patron or municipal clan faction
    estimated_strength TEXT DEFAULT 'Unspecified',              -- e.g. 15-20 armed personnel
    total_est_firearms TEXT DEFAULT 'Unspecified',              -- e.g. 15 (8x M16, 4x M14, 2x Cal .45, 1x M203)
    firearms_inventory TEXT DEFAULT 'Unspecified',              -- Firearms inventory breakdown
    province TEXT NOT NULL DEFAULT 'Maguindanao del Sur',       -- Staging Province
    municipality TEXT NOT NULL DEFAULT 'Datu Piang (Dulawan)',  -- Staging Municipality / City
    barangay TEXT NOT NULL DEFAULT 'Poblacion',                 -- Staging Barangay
    purok_sitio TEXT,                                           -- Sitio / Purok / Specific compound
    address TEXT,                                               -- Full computed geographic address
    mgrs TEXT NOT NULL,                                         -- MGRS Grid Ref e.g. 51NXH6659745322
    lat DOUBLE PRECISION NOT NULL DEFAULT 6.9536,               -- WGS84 Latitude
    lng DOUBLE PRECISION NOT NULL DEFAULT 124.4756,             -- WGS84 Longitude
    status TEXT NOT NULL DEFAULT 'Active',                      -- Active, Monitored, Dormant, Disbanded
    threat_level TEXT NOT NULL DEFAULT 'high',                  -- critical, high, medium, low
    notes TEXT,                                                 -- Operational notes and debrief remarks
    remarks TEXT,                                               -- Tactical remarks
    metadata JSONB DEFAULT '{}'::jsonb,                         -- Extensible metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Idempotent Column Additions (Ensures schema consistency if table already existed)
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS commander_leader TEXT;
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS affiliated_politician_faction TEXT;
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS estimated_strength TEXT DEFAULT 'Unspecified';
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS total_est_firearms TEXT DEFAULT 'Unspecified';
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS firearms_inventory TEXT DEFAULT 'Unspecified';
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS province TEXT DEFAULT 'Maguindanao del Sur';
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS municipality TEXT DEFAULT 'Datu Piang (Dulawan)';
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS barangay TEXT DEFAULT 'Poblacion';
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS purok_sitio TEXT;
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS mgrs TEXT;
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION DEFAULT 6.9536;
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION DEFAULT 124.4756;
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS threat_level TEXT DEFAULT 'high';
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.cmo_piags ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 5. Create Performance & Geospatial Indexes
CREATE INDEX IF NOT EXISTS idx_cmo_piags_group_name ON public.cmo_piags(group_name);
CREATE INDEX IF NOT EXISTS idx_cmo_piags_status ON public.cmo_piags(status);
CREATE INDEX IF NOT EXISTS idx_cmo_piags_threat_level ON public.cmo_piags(threat_level);
CREATE INDEX IF NOT EXISTS idx_cmo_piags_mgrs ON public.cmo_piags(mgrs);
CREATE INDEX IF NOT EXISTS idx_cmo_piags_created_at ON public.cmo_piags(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cmo_piags_coords ON public.cmo_piags(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- 6. Updated-At Trigger
CREATE OR REPLACE FUNCTION public.update_cmo_piags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cmo_piags_updated_at ON public.cmo_piags;
CREATE TRIGGER trg_cmo_piags_updated_at
    BEFORE UPDATE ON public.cmo_piags
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cmo_piags_updated_at();

-- 7. Configure Row-Level Security (RLS)
ALTER TABLE public.cmo_piags ENABLE ROW LEVEL SECURITY;

-- Drop prior policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on cmo_piags" ON public.cmo_piags;
DROP POLICY IF EXISTS "Allow public select on cmo_piags" ON public.cmo_piags;
DROP POLICY IF EXISTS "Allow public insert on cmo_piags" ON public.cmo_piags;
DROP POLICY IF EXISTS "Allow public update on cmo_piags" ON public.cmo_piags;
DROP POLICY IF EXISTS "Allow public delete on cmo_piags" ON public.cmo_piags;

-- Universal full-access policy for dashboard operators (anon + authenticated)
CREATE POLICY "Allow all operations on cmo_piags"
    ON public.cmo_piags FOR ALL
    TO anon, authenticated, public
    USING (true)
    WITH CHECK (true);

-- 8. Enable Realtime Replication for Live Multi-Operator Synchronization
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'cmo_piags'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cmo_piags;
    END IF;
END $$;

-- 9. Insert Initial PIAG Location Records Created in the PIAG Location Modal
INSERT INTO public.cmo_piags (
    id,
    group_name,
    commander_leader,
    affiliated_politician_faction,
    estimated_strength,
    total_est_firearms,
    firearms_inventory,
    province,
    municipality,
    barangay,
    purok_sitio,
    address,
    mgrs,
    lat,
    lng,
    status,
    threat_level,
    notes,
    remarks,
    metadata,
    created_at,
    updated_at
) VALUES 
(
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c81',
    'MILF — 105th Base Command',
    'Commander Jack / Ting Sinsuat',
    'Former Mayoralty candidate / Municipal Boss',
    '15-20 armed personnel',
    '12 (8x M16, 2x M14, 1x M203, 1x Cal .45)',
    '12 (8x M16, 2x M14, 1x M203, 1x Cal .45)',
    'Maguindanao del Sur',
    'Datu Piang (Dulawan)',
    'Poblacion',
    'Sitio Riverside',
    'Sitio Riverside, Poblacion, Datu Piang (Dulawan), Maguindanao del Sur',
    '51NXH6659745322',
    6.9536,
    124.4756,
    'Active',
    'critical',
    'Staging element active along river crossing. Surveillance reports indicate mobilization for localized election security intimidation.',
    'Staging element active along river crossing. Surveillance reports indicate mobilization for localized election security intimidation.',
    '{"is_piag": true, "cmo_type": "piag", "group_type": "MILF"}'::jsonb,
    NOW(),
    NOW()
),
(
    'b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d92',
    'MNLF — Lupah Sug Force',
    'Commander Abdulradzak / Kuyo Aliman',
    'Provincial Board & Tayuan Faction Alliance',
    '25-30 armed personnel',
    '22 (14x M16, 5x M14, 2x M203, 1x Ultimax 100 LMG)',
    '22 (14x M16, 5x M14, 2x M203, 1x Ultimax 100 LMG)',
    'Maguindanao del Sur',
    'Nabalawag',
    'Brgy Olandang',
    'Sitio Bentad',
    'Sitio Bentad, Brgy Olandang, Nabalawag, Maguindanao del Sur',
    '51NXH6771379711',
    7.0515,
    124.5184,
    'Active',
    'high',
    'Previously engaged in territorial dispute encounter in Sitio Bentad. Continuous monitoring by CMO Civil Relations service.',
    'Previously engaged in territorial dispute encounter in Sitio Bentad. Continuous monitoring by CMO Civil Relations service.',
    '{"is_piag": true, "cmo_type": "piag", "group_type": "MNLF"}'::jsonb,
    NOW(),
    NOW()
),
(
    'c3d4e5f6-a1b2-4c3d-ae4f-5a6b7c8d9e03',
    'MILF — 118th Base Command',
    'Field Cmdr Ebrahim Usman @Bords / Badrudin Angkad',
    'Hon. Esmael Tayuan / SGA Coalition',
    '15-20 armed combatants',
    '18 (11x M16, 3x M14, 2x M203, 2x Cal .50 Barrett)',
    '18 (11x M16, 3x M14, 2x M203, 2x Cal .50 Barrett)',
    'Maguindanao del Sur',
    'Shariff Saydona Mustapha',
    'Datu Bakal',
    'Sitio Bakal Proper',
    'Sitio Bakal Proper, Datu Bakal, Shariff Saydona Mustapha, Maguindanao del Sur',
    '51NXH7120068400',
    6.9500,
    124.5200,
    'Monitored',
    'high',
    'Maintains armed presence near marsh perimeter. Dialogue facilitated through Coordinating Committee on the Cessation of Hostilities (CCCH).',
    'Maintains armed presence near marsh perimeter. Dialogue facilitated through Coordinating Committee on the Cessation of Hostilities (CCCH).',
    '{"is_piag": true, "cmo_type": "piag", "group_type": "MILF"}'::jsonb,
    NOW(),
    NOW()
),
(
    'd4e5f6a1-b2c3-4d4e-bf5a-6b7c8d9e0f14',
    'MNLF — Paglas Defense Contingent',
    'Ustadz Wahab / Datu Ronnie',
    'Municipal Executive Clan Alliance',
    '10-15 combatants',
    '10 (6x M16, 2x Garand, 2x .45 pistols)',
    '10 (6x M16, 2x Garand, 2x .45 pistols)',
    'Maguindanao del Sur',
    'Datu Paglas',
    'Poblacion',
    'Compound Alpha',
    'Compound Alpha, Poblacion, Datu Paglas, Maguindanao del Sur',
    '51NYG0598964012',
    6.7450,
    124.8600,
    'Monitored',
    'medium',
    'Defensive perimeter security around municipal estate. Low offensive posture recorded during recent intelligence sweep.',
    'Defensive perimeter security around municipal estate. Low offensive posture recorded during recent intelligence sweep.',
    '{"is_piag": true, "cmo_type": "piag", "group_type": "MNLF"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    group_name = EXCLUDED.group_name,
    commander_leader = EXCLUDED.commander_leader,
    affiliated_politician_faction = EXCLUDED.affiliated_politician_faction,
    estimated_strength = EXCLUDED.estimated_strength,
    total_est_firearms = EXCLUDED.total_est_firearms,
    firearms_inventory = EXCLUDED.firearms_inventory,
    province = EXCLUDED.province,
    municipality = EXCLUDED.municipality,
    barangay = EXCLUDED.barangay,
    purok_sitio = EXCLUDED.purok_sitio,
    address = EXCLUDED.address,
    mgrs = EXCLUDED.mgrs,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    status = EXCLUDED.status,
    threat_level = EXCLUDED.threat_level,
    notes = EXCLUDED.notes,
    remarks = EXCLUDED.remarks,
    updated_at = NOW();

-- 10. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';


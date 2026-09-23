-- ==============================================================================
-- SUPABASE MIGRATION: Dedicated Incidents Table (public.incidents)
-- Separate, Standalone SQL Table (NOT in the unified records table)
-- Tactical Command Dashboard
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Project Dashboard (https://app.supabase.com)
-- 2. Go to SQL Editor -> New Query
-- 3. Paste this script and click RUN
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. If public.incidents was previously created as a VIEW on records, drop it first
DROP VIEW IF EXISTS public.incidents CASCADE;

-- 3. Create Dedicated Standalone Incidents Table
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT,                                -- e.g. OPS-102, INC-405
    title TEXT NOT NULL,                      -- e.g. Armed Clash — Sector Alpha
    operation_type TEXT,                      -- e.g. Armed Clash, Hostile Fire, IED, Patrol
    area TEXT,                                -- Sector or Area name
    location_name TEXT,                       -- Location description or village name
    mgrs TEXT,                                -- MGRS Grid Coordinate e.g. 51NXH12345678
    priority TEXT DEFAULT 'medium',           -- low, medium, high, critical
    status TEXT DEFAULT 'active',             -- active, pending, closed, archived
    lat DOUBLE PRECISION,                     -- WGS84 Latitude
    lng DOUBLE PRECISION,                     -- WGS84 Longitude
    narrative TEXT,                           -- Tactical result, outcome, narrative details
    description TEXT,                         -- Full narrative or debrief
    dtg TEXT,                                 -- Date-Time Group formatted string e.g. 180930Z SEP 26
    incident_date TIMESTAMPTZ DEFAULT NOW(),  -- Date of occurrence
    metadata JSONB DEFAULT '{}'::jsonb,       -- Extra tactical parameters
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Ensure all columns exist (in case table was partially created previously)
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS operation_type TEXT;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS mgrs TEXT;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS narrative TEXT;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS dtg TEXT;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS incident_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON public.incidents(priority);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_operation_type ON public.incidents(operation_type);
CREATE INDEX IF NOT EXISTS idx_incidents_area ON public.incidents(area);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_coordinates ON public.incidents(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- 6. Updated-At Trigger Function
CREATE OR REPLACE FUNCTION public.update_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incidents_updated_at ON public.incidents;
CREATE TRIGGER trg_incidents_updated_at
    BEFORE UPDATE ON public.incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_incidents_updated_at();

-- 7. Row Level Security (RLS) Configuration
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies
DROP POLICY IF EXISTS "Allow all operations on incidents" ON public.incidents;
DROP POLICY IF EXISTS "Allow public select on incidents" ON public.incidents;
DROP POLICY IF EXISTS "Allow public insert on incidents" ON public.incidents;
DROP POLICY IF EXISTS "Allow public update on incidents" ON public.incidents;
DROP POLICY IF EXISTS "Allow public delete on incidents" ON public.incidents;

-- Universal full-access policy for dashboard operators
CREATE POLICY "Allow all operations on incidents"
    ON public.incidents FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 8. Enable Realtime Replication
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 9. Refresh PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';

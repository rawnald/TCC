-- ==============================================================================
-- SUPABASE MIGRATION: Daily Intelligence Bulletin (public.intel_dib)
-- Instructions: Copy and paste this script directly into Supabase SQL Editor and click RUN
-- ==============================================================================

-- 1. Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create intel_dib Table
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

-- 3. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_intel_dib_dib_id ON public.intel_dib(dib_id);
CREATE INDEX IF NOT EXISTS idx_intel_dib_type ON public.intel_dib(type);
CREATE INDEX IF NOT EXISTS idx_intel_dib_threat_group ON public.intel_dib(threat_group);
CREATE INDEX IF NOT EXISTS idx_intel_dib_motive ON public.intel_dib(motive);
CREATE INDEX IF NOT EXISTS idx_intel_dib_created_at ON public.intel_dib(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intel_dib_mgrs ON public.intel_dib(mgrs);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.intel_dib ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policy if present and create permissive policy for operations
DROP POLICY IF EXISTS "Allow all operations on intel_dib" ON public.intel_dib;
CREATE POLICY "Allow all operations on intel_dib"
    ON public.intel_dib FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Enable Realtime Replication for instant dashboard live updates
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

-- ==============================================================================
-- SCHEMA ALIGNMENT SCRIPT
-- Run this in your Supabase SQL Editor to add all required columns for all modules.
-- ==============================================================================

-- 1. Align force_units table
ALTER TABLE public.force_units 
    ADD COLUMN IF NOT EXISTS battalion TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS brigade TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS area TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS afp_officers INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS afp_enlisted INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS caa INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS wavs_tavs INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS air_assets INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vehicle INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS naval_assets INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS isr_asset INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS artillery_asset INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS mgrs TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';

-- 2. Align incidents table
ALTER TABLE public.incidents
    ADD COLUMN IF NOT EXISTS code TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS operation_type TEXT DEFAULT 'Combat Ops',
    ADD COLUMN IF NOT EXISTS area TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS incident_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- 3. Align movement_deployments table
ALTER TABLE public.movement_deployments
    ADD COLUMN IF NOT EXISTS unit_people TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS directive_details TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS location_from TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS location_to TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS movement_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS mode_of_movement TEXT DEFAULT 'Land / Wheeled';

-- 4. Align spot_reports table
ALTER TABLE public.spot_reports
    ADD COLUMN IF NOT EXISTS event TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS incident_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS unit_involved TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS results TEXT DEFAULT '';

-- 5. Align intel_dib table
ALTER TABLE public.intel_dib
    ADD COLUMN IF NOT EXISTS dib_id TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS activity TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS details TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS datetime TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS threat_group TEXT DEFAULT 'BIFF',
    ADD COLUMN IF NOT EXISTS threat_group_other TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS personality_victim TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS motive TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS source_evaluation TEXT DEFAULT 'B-2',
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Threat Advisory',
    ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS municipality TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS barangay TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS purok_sitio TEXT DEFAULT '';

-- 6. Align cmo_rido table
ALTER TABLE public.cmo_rido
    ADD COLUMN IF NOT EXISTS party_a_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS party_a_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS party_b_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS party_b_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS mediating_agency TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS lead_mediator TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS fatalities_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS wounded_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS displaced_families INTEGER DEFAULT 0;

-- 7. Align cmo_piags table
ALTER TABLE public.cmo_piags
    ADD COLUMN IF NOT EXISTS commander_leader TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS affiliated_politician_faction TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS estimated_strength INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_est_firearms INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS firearms_inventory TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS threat_level TEXT DEFAULT 'Moderate',
    ADD COLUMN IF NOT EXISTS remarks TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';


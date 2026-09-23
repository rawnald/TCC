-- ==============================================================================
-- Migration: Standalone cmo_rido Table for CMO Conflict Management
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Create the cmo_rido table with 2-Column Feuding Clan Schema & MGRS Locations
CREATE TABLE IF NOT EXISTS public.cmo_rido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_code TEXT NOT NULL,
  feuding_parties TEXT NOT NULL,
  
  -- Clan / Party A Columns
  party_a TEXT NOT NULL,
  party_a_personalities TEXT,
  party_a_affiliation TEXT,
  party_a_mgrs TEXT,
  party_a_lat DOUBLE PRECISION,
  party_a_lng DOUBLE PRECISION,
  
  -- Clan / Party B Columns
  party_b TEXT NOT NULL,
  party_b_personalities TEXT,
  party_b_affiliation TEXT,
  party_b_mgrs TEXT,
  party_b_lat DOUBLE PRECISION,
  party_b_lng DOUBLE PRECISION,
  
  -- Overall Personalities & Conflict Location
  personalities_involved TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT 'Maguindanao del Sur',
  municipality TEXT NOT NULL DEFAULT 'Datu Piang (Dulawan)',
  barangay TEXT NOT NULL DEFAULT 'Poblacion',
  purok_sitio TEXT,
  address TEXT NOT NULL,
  mgrs TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL DEFAULT 6.9536,
  lng DOUBLE PRECISION NOT NULL DEFAULT 124.4756,
  
  -- Root Cause & Current Status Dropdowns
  root_cause TEXT NOT NULL DEFAULT 'Land Dispute & Boundary Conflict',
  root_cause_other TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  
  -- Mediation Mechanism & Casualties
  mediating_agency TEXT NOT NULL DEFAULT '601st Infantry Brigade (6ID, PA)',
  lead_mediator TEXT,
  fatalities_count INTEGER DEFAULT 0,
  wounded_count INTEGER DEFAULT 0,
  displaced_families INTEGER DEFAULT 0,
  
  -- Narrative History & Peace Progress
  narrative_history TEXT,
  settlement_terms TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist idempotently if table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_a_personalities') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_a_personalities TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_a_affiliation') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_a_affiliation TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_a_mgrs') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_a_mgrs TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_a_lat') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_a_lat DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_a_lng') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_a_lng DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_b_personalities') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_b_personalities TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_b_affiliation') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_b_affiliation TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_b_mgrs') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_b_mgrs TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_b_lat') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_b_lat DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cmo_rido' AND column_name = 'party_b_lng') THEN
    ALTER TABLE public.cmo_rido ADD COLUMN party_b_lng DOUBLE PRECISION;
  END IF;
END $$;

-- 2. Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_cmo_rido_case_code ON public.cmo_rido(case_code);
CREATE INDEX IF NOT EXISTS idx_cmo_rido_status ON public.cmo_rido(status);
CREATE INDEX IF NOT EXISTS idx_cmo_rido_root_cause ON public.cmo_rido(root_cause);
CREATE INDEX IF NOT EXISTS idx_cmo_rido_coords ON public.cmo_rido(lat, lng);
CREATE INDEX IF NOT EXISTS idx_cmo_rido_party_a_aff ON public.cmo_rido(party_a_affiliation);
CREATE INDEX IF NOT EXISTS idx_cmo_rido_party_b_aff ON public.cmo_rido(party_b_affiliation);

-- 3. Row Level Security (RLS) - Permissive for Anon, Authenticated, and Service Roles
ALTER TABLE public.cmo_rido ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cmo_rido_all_access" ON public.cmo_rido;
DROP POLICY IF EXISTS "Allow all on cmo_rido" ON public.cmo_rido;

CREATE POLICY "cmo_rido_all_access" ON public.cmo_rido
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Enable Supabase Realtime Replication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cmo_rido;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- 5. Pre-seed Initial Starter Rido Cases with 2-Column Clan Personalities & PIAG Affiliation
INSERT INTO public.cmo_rido (
  id,
  case_code,
  feuding_parties,
  party_a,
  party_a_personalities,
  party_a_affiliation,
  party_a_mgrs,
  party_a_lat,
  party_a_lng,
  party_b,
  party_b_personalities,
  party_b_affiliation,
  party_b_mgrs,
  party_b_lat,
  party_b_lng,
  personalities_involved,
  province,
  municipality,
  barangay,
  purok_sitio,
  address,
  mgrs,
  lat,
  lng,
  root_cause,
  status,
  mediating_agency,
  lead_mediator,
  fatalities_count,
  wounded_count,
  displaced_families,
  narrative_history,
  settlement_terms
) VALUES
  (
    'e1f2a3b4-5678-4abc-def0-123456789001',
    'RIDO-2026-8801',
    'Sula Clan vs. Pendatun Family',
    'Sula Family / Datu Odin Faction',
    'Datu Norodin Sula (Patriarch), Mike Sula (Armed enforcer), Kagawad Teng Sula',
    'MILF — 105th Base Command',
    '51NXH6659745322',
    6.9536,
    124.4756,
    'Pendatun Clan / Commander Falcon Elements',
    'Kumander Abdul Pendatun, Barok Karim (Sub-leader), Nasser Pendatun',
    'MNLF — Lupah Sug Force',
    '51NXH6771379711',
    6.9842,
    124.5312,
    'Party A: Datu Norodin Sula, Mike Sula. Party B: Kumander Abdul Pendatun, Barok Karim.',
    'Maguindanao del Sur',
    'Datu Piang (Dulawan)',
    'Reina Regente',
    'Sitio Sambulawan',
    'Sitio Sambulawan, Reina Regente, Datu Piang (Dulawan), Maguindanao del Sur',
    '51NXH6659745322',
    6.9536,
    124.4756,
    'Land Dispute & Boundary Conflict',
    'Active',
    '601st Infantry Brigade (6ID, PA)',
    'Col. Olaso / Joint Peace Committee',
    3,
    5,
    42,
    'Armed skirmish triggered by boundary marker destruction along marshland agricultural parcel. Intermittent exchanges of fire reported near riverbank perimeter.',
    'Temporary ceasefire brokered under Joint Task Force Central; elders proposed demarcation dialogue.'
  ),
  (
    'e1f2a3b4-5678-4abc-def0-123456789002',
    'RIDO-2026-8802',
    'Mangudadatu Alliance vs. Ampatuan Local Faction',
    'Mangudadatu Alliance Elements',
    'Mayor Freddie Mangudadatu, Datu Ali Mangudadatu, Escort Commander Jerry',
    'MILF — 118th Base Command',
    '51NXH7120068400',
    7.0645,
    124.4891,
    'Ampatuan Local Contingent',
    'Datu Anwar Ampatuan Jr., Commander Boyet, Datu Zaldy Loyalists',
    'MNLF — Paglas Defense Contingent',
    '51NYG0598964012',
    6.7412,
    124.8723,
    'Party A: Mayor Freddie Mangudadatu, Datu Ali. Party B: Datu Anwar Ampatuan Jr., Cmdr Boyet.',
    'Maguindanao del Sur',
    'Shariff Aguak (Maganoy)',
    'Poblacion',
    'Purok Masagana',
    'Purok Masagana, Poblacion, Shariff Aguak (Maganoy), Maguindanao del Sur',
    '51NXH6521378120',
    6.8623,
    124.4412,
    'Political Rivalry & Election Feud',
    'Under Mediation',
    'Provincial Peace and Order Council (PPOC)',
    'Gov. Bai Mariam Mangudadatu / Ulama Council',
    1,
    2,
    15,
    'Escalated following confrontation during local barangay assembly. Both sides mobilized armed affiliates along key municipal crossroads.',
    'Bilateral covenant signed requiring removal of unauthorized barricades and surrendering involved trigger-pullers.'
  )
ON CONFLICT (id) DO UPDATE SET
  feuding_parties = EXCLUDED.feuding_parties,
  party_a = EXCLUDED.party_a,
  party_a_personalities = EXCLUDED.party_a_personalities,
  party_a_affiliation = EXCLUDED.party_a_affiliation,
  party_a_mgrs = EXCLUDED.party_a_mgrs,
  party_b = EXCLUDED.party_b,
  party_b_personalities = EXCLUDED.party_b_personalities,
  party_b_affiliation = EXCLUDED.party_b_affiliation,
  party_b_mgrs = EXCLUDED.party_b_mgrs,
  personalities_involved = EXCLUDED.personalities_involved,
  root_cause = EXCLUDED.root_cause,
  status = EXCLUDED.status,
  narrative_history = EXCLUDED.narrative_history,
  settlement_terms = EXCLUDED.settlement_terms,
  updated_at = timezone('utc'::text, now());


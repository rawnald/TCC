-- ============================================================
-- Personnel DLT (Disposition & Location of Troops) Table
-- Run this in your Supabase SQL Editor to create/reset the table.
-- ============================================================

-- Drop existing table if schema changed (careful in production)
-- DROP TABLE IF EXISTS public.personnel_dlt;

CREATE TABLE IF NOT EXISTS public.personnel_dlt (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Commander Name fields
  rank               TEXT NOT NULL DEFAULT 'MAJ',
  name               TEXT NOT NULL,
  serial_number      TEXT NOT NULL DEFAULT '',
  afpos              TEXT NOT NULL DEFAULT 'INF',
  branch_of_service  TEXT NOT NULL DEFAULT 'PA', -- PA, PAF, PN, PN(M)

  -- Assignment
  designation        TEXT NOT NULL DEFAULT '',
  unit_id            TEXT DEFAULT NULL,   -- FK ref to force_units.id (soft, no FK constraint)
  unit_name          TEXT NOT NULL DEFAULT '',

  -- Location
  location           TEXT NOT NULL DEFAULT '',
  mgrs               TEXT DEFAULT '',
  contact_number     TEXT DEFAULT '',

  -- Strength (all categories)
  officers_count     INTEGER NOT NULL DEFAULT 0,
  ep_count           INTEGER NOT NULL DEFAULT 0,  -- Enlisted Personnel
  caa_count          INTEGER NOT NULL DEFAULT 0,  -- CAFGU Active Auxiliary
  ce_count           INTEGER NOT NULL DEFAULT 0,  -- Civilian Employees

  -- Command & Status
  date_assumption    DATE NOT NULL DEFAULT CURRENT_DATE,
  status             TEXT NOT NULL DEFAULT 'Organic', -- Organic | Opcon

  created_at         TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at         TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.personnel_dlt ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on personnel_dlt" ON public.personnel_dlt;
CREATE POLICY "Allow all operations on personnel_dlt"
  ON public.personnel_dlt
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── Realtime ────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.personnel_dlt;
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ── Auto-update updated_at ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS personnel_dlt_updated_at ON public.personnel_dlt;
CREATE TRIGGER personnel_dlt_updated_at
  BEFORE UPDATE ON public.personnel_dlt
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── PostgREST schema reload ──────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

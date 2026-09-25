-- ==============================================================================
-- Migration: Add Mobile Number and Contact # to public.personnel_profiles
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Add contact_number and mobile_number columns if they do not already exist
ALTER TABLE public.personnel_profiles 
ADD COLUMN IF NOT EXISTS mobile_number TEXT DEFAULT '';

ALTER TABLE public.personnel_profiles 
ADD COLUMN IF NOT EXISTS contact_number TEXT DEFAULT '';

-- 2. Create search index for quick phone number lookups
CREATE INDEX IF NOT EXISTS idx_personnel_profiles_mobile 
ON public.personnel_profiles(mobile_number);

CREATE INDEX IF NOT EXISTS idx_personnel_profiles_contact 
ON public.personnel_profiles(contact_number);

-- 3. Verify columns were created
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'personnel_profiles' 
  AND column_name IN ('mobile_number', 'contact_number');

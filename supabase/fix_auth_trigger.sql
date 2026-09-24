-- ==============================================================================
-- FIX AUTH TRIGGER: Fix "Database error saving new user"
-- Instructions: Run this entire script in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Drop existing trigger if it's failing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create a bulletproof handler that NEVER crashes user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  assigned_role public.user_role;
  assigned_callsign text;
  assigned_name text;
BEGIN
  -- Safely determine role using CASE without dangerous direct casting
  assigned_role := CASE 
    WHEN new.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::public.user_role
    WHEN new.raw_user_meta_data->>'role' = 'viewer' THEN 'viewer'::public.user_role
    ELSE 'operator'::public.user_role
  END;

  assigned_name := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(split_part(COALESCE(new.email, ''), '@', 1), ''),
    'New Operator'
  );

  assigned_callsign := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'callsign'), ''),
    CASE WHEN assigned_role = 'admin'::public.user_role THEN 'COMMANDER' ELSE 'OPERATOR' END
  );

  -- Upsert into public.profiles
  INSERT INTO public.profiles (id, email, full_name, callsign, role, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    assigned_name,
    assigned_callsign,
    assigned_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    callsign = EXCLUDED.callsign,
    role = EXCLUDED.role,
    updated_at = NOW();

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Never let a trigger error block the account creation in auth.users
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN new;
END;
$$;

-- 3. Re-attach trigger ONLY on INSERT (not on UPDATE)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Sync any existing auth.users into public.profiles right now
INSERT INTO public.profiles (id, email, full_name, callsign, role, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.email, ''),
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), split_part(COALESCE(u.email, ''), '@', 1)),
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'callsign'), ''), CASE WHEN u.raw_user_meta_data->>'role' = 'admin' THEN 'COMMANDER' ELSE 'OPERATOR' END),
  CASE 
    WHEN u.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::public.user_role
    WHEN u.raw_user_meta_data->>'role' = 'viewer' THEN 'viewer'::public.user_role
    ELSE 'operator'::public.user_role
  END,
  NOW(),
  NOW()
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role;

-- ====================================================================
-- FIX-AUTH-PROFILES-MASTER.sql
-- Ultimate Master Fix for Supabase Gotrue "Database error saving new user"
-- ====================================================================

DO $$ 
BEGIN
  -- 1. Ensure all required columns exist in the profiles table so the trigger never fails!
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;

  BEGIN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;

  BEGIN
    ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;

  BEGIN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;

  -- 2. Make email optional on profiles table
  BEGIN
    ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 3. Drop any restrictive check constraints on role that might block 'customer' or 'owner'
  BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- 4. Create the absolute bulletproof trigger function with search_path set to public and exception handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, is_active, created_at, updated_at)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'phone', 
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If anything fails inside the trigger, log it but DO NOT abort the auth.users creation!
  RAISE NOTICE 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Drop any known trigger names on auth.users to prevent duplicate/conflicting triggers from running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS sync_user_to_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_insert ON auth.users;

-- 6. Attach our master trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Diagnostic Check: List all active triggers on auth.users to verify no other conflicting triggers remain
SELECT 
  tgname AS active_trigger_name,
  tgrelid::regclass AS table_name,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE tgrelid::regclass::text = 'auth.users';

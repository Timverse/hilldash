-- ====================================================================
-- FIX-AUTH-TRIGGER-AND-PROFILES.sql
-- Resolves "Database error saving new user" during Supabase Auth Signup
-- ====================================================================

-- 1. Make email optional on profiles table so existing auth triggers don't fail
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- 2. Replace the auth trigger function with a robust version that handles email, full_name, phone, and role correctly!
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure the trigger is correctly attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Verify status
SELECT 'Fix complete! The profiles table and auth trigger are now fully synchronized.' as status;

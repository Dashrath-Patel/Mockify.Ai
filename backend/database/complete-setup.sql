-- COMPLETE SETUP: Install Trigger + Fix Missing Profiles
-- Copy and paste this ENTIRE script into Supabase SQL Editor and click "Run"
-- This will fix existing users AND prevent future issues

-- ============================================
-- PART 1: Install the Trigger
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Extract name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NULLIF(TRIM(CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Insert with only required fields
  INSERT INTO public.users (id, email, name, created_at)
  VALUES (NEW.id, NEW.email, user_name, NEW.created_at)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PART 2: Fix Existing Users Without Profiles
-- ============================================

-- Create profiles for all users missing them
INSERT INTO public.users (id, email, name, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    NULLIF(TRIM(CONCAT(
      COALESCE(au.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(au.raw_user_meta_data->>'last_name', '')
    )), ''),
    SPLIT_PART(au.email, '@', 1)
  ) as name,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
  AND au.email IS NOT NULL
  AND au.email_confirmed_at IS NOT NULL; -- Only confirmed users

-- ============================================
-- PART 3: Verification
-- ============================================

-- Show summary
DO $$
DECLARE
  total_auth_users INTEGER;
  total_profiles INTEGER;
  missing_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_auth_users FROM auth.users WHERE email_confirmed_at IS NOT NULL;
  SELECT COUNT(*) INTO total_profiles FROM public.users;
  
  SELECT COUNT(*) INTO missing_profiles 
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL AND au.email_confirmed_at IS NOT NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total confirmed auth users: %', total_auth_users;
  RAISE NOTICE 'Total user profiles: %', total_profiles;
  RAISE NOTICE 'Missing profiles: %', missing_profiles;
  RAISE NOTICE '========================================';
  
  IF missing_profiles = 0 THEN
    RAISE NOTICE '✅ All users have profiles!';
  ELSE
    RAISE WARNING '⚠️ Some users still missing profiles';
  END IF;
  
  RAISE NOTICE '✅ Trigger installed - new users will auto-create profiles';
  RAISE NOTICE '========================================';
END $$;

-- Show recent users with their profiles
SELECT 
  au.email,
  au.email_confirmed_at,
  pu.name,
  CASE 
    WHEN pu.id IS NOT NULL THEN '✅ Has Profile'
    ELSE '❌ Missing Profile'
  END as profile_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC
LIMIT 10;

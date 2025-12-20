-- Fix Missing User Profiles
-- This script creates profiles for users who exist in auth.users but not in public.users
-- Run this in Supabase SQL Editor

-- Step 1: Check how many users are missing profiles
SELECT 
  'Users missing profiles:' as status,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Step 2: Create profiles for all users missing them
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
  AND au.email IS NOT NULL;

-- Step 3: Verify all users now have profiles
SELECT 
  'Profiles created successfully!' as status,
  COUNT(*) as total_users_with_profiles
FROM public.users;

-- Step 4: Show the newly created profiles
SELECT 
  id,
  email,
  name,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

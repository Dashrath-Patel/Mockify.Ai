-- Check for authenticated users that don't exist in the users table
SELECT 
    au.id,
    au.email,
    au.created_at,
    CASE WHEN u.id IS NULL THEN 'Missing from users table' ELSE 'Exists' END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email IS NOT NULL;

-- Insert any missing users into the users table
-- (This will help fix the foreign key constraint issue)
INSERT INTO public.users (id, name, email, exam_type, language)
SELECT 
    au.id,
    COALESCE(
        (au.raw_user_meta_data->>'full_name')::text,
        split_part(au.email, '@', 1),
        'Anonymous'
    ) as name,
    au.email,
    NULL as exam_type,
    'English' as language
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL 
  AND au.email IS NOT NULL
  AND au.deleted_at IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify all users now exist
SELECT 
    COUNT(*) as total_auth_users,
    COUNT(u.id) as users_in_table,
    COUNT(*) - COUNT(u.id) as missing_users
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email IS NOT NULL AND au.deleted_at IS NULL;
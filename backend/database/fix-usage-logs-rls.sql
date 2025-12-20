-- =============================================================================
-- Fix RLS policies for usage_logs table
-- =============================================================================
-- ISSUE: Trigger increment_test_usage() tries to INSERT into usage_logs
--        but RLS blocks it because there's no INSERT policy
-- 
-- SOLUTION: Add INSERT policy OR make trigger function SECURITY DEFINER
--           We'll use INSERT policy to maintain user-level security
-- =============================================================================

-- Add INSERT policy for usage_logs (allow users to log their own usage)
DO $$ BEGIN
    CREATE POLICY "Users can insert own usage logs" ON public.usage_logs 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION 
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Policy "Users can insert own usage logs" already exists, skipping.';
END $$;

-- Add UPDATE policy for usage_logs (in case needed for corrections)
DO $$ BEGIN
    CREATE POLICY "Users can update own usage logs" ON public.usage_logs 
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION 
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Policy "Users can update own usage logs" already exists, skipping.';
END $$;

-- Verify the policies were created
DO $$ 
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'usage_logs';
    
    RAISE NOTICE 'Total policies on usage_logs table: %', policy_count;
END $$;

-- Display all policies for verification
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Read'
        WHEN cmd = 'INSERT' THEN 'Create'
        WHEN cmd = 'UPDATE' THEN 'Update'
        WHEN cmd = 'DELETE' THEN 'Delete'
        ELSE cmd
    END as operation
FROM pg_policies
WHERE tablename = 'usage_logs'
ORDER BY cmd, policyname;

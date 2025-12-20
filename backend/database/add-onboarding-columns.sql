-- Migration: Add onboarding-related columns to users table
-- This script safely adds columns needed for the onboarding flow
-- Run this in Supabase SQL Editor

-- Add onboarding columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS selected_exam TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS onboarding_goals JSONB DEFAULT '{}';

-- Create index for faster onboarding status checks
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON public.users(onboarding_completed);

-- Update existing users to mark them as having completed onboarding
-- (so they don't see the onboarding flow)
UPDATE public.users 
SET onboarding_completed = true 
WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('selected_exam', 'onboarding_completed', 'preferred_language', 'onboarding_goals');

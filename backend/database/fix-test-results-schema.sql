-- Fix test_results table to match actual database structure

-- Drop existing test_results table if it exists with wrong foreign keys
DROP TABLE IF EXISTS public.test_results CASCADE;

-- Create test_results table with correct foreign key to mock_tests
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}', -- Store user answers
    score INTEGER NOT NULL DEFAULT 0, -- Score percentage
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    time_spent INTEGER NOT NULL DEFAULT 0, -- in seconds (renamed from time_taken)
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for test_results
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own test results" ON public.test_results;
DROP POLICY IF EXISTS "Users can insert own test results" ON public.test_results;

CREATE POLICY "Users can view own test results" 
    ON public.test_results 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test results" 
    ON public.test_results 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON public.test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_completed_at ON public.test_results(completed_at);

-- Note: If you have a 'results' table, you may want to migrate data:
-- INSERT INTO test_results (test_id, user_id, answers, score, total_questions, correct_answers, time_spent, completed_at)
-- SELECT test_id, user_id, answers, score, total_questions, correct_answers, time_taken, completed_at
-- FROM results
-- WHERE test_id IN (SELECT id FROM mock_tests);

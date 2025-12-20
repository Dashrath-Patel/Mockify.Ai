-- Create doubt_history table for AI Tutor feature
-- Stores student doubt resolution interactions

CREATE TABLE IF NOT EXISTS public.doubt_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    doubt_text TEXT NOT NULL,
    was_helpful BOOLEAN DEFAULT NULL, -- null = no feedback yet, true/false = user feedback
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.doubt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own doubt history" 
    ON public.doubt_history 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own doubt history" 
    ON public.doubt_history 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own doubt history" 
    ON public.doubt_history 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_doubt_history_user_id 
    ON public.doubt_history(user_id);

CREATE INDEX IF NOT EXISTS idx_doubt_history_created_at 
    ON public.doubt_history(created_at DESC);

-- Add comment
COMMENT ON TABLE public.doubt_history IS 'Stores AI Tutor doubt resolution interactions for analytics and improvement';

-- Migration: Add onboarding goals and exam templates support
-- This enables Step 2 (Onboarding) and Step 5 (Question Generation) from the blueprint

-- Add goals JSONB column to users table for onboarding questionnaire
-- Structure: { exam_type: string, score_target: number, deadline: date, weak_areas: string[], focus_topics: string[] }
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '{}';

-- Create exam_templates table for prompt templates and syllabus mapping
CREATE TABLE IF NOT EXISTS public.exam_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_type TEXT NOT NULL UNIQUE CHECK (exam_type IN ('SSC', 'Banking', 'UPSC', 'JEE', 'NEET', 'CAT', 'GATE', 'Other')),
    syllabus_map JSONB NOT NULL DEFAULT '{}', -- Topic -> Subtopics mapping
    prompt_templates JSONB NOT NULL DEFAULT '{}', -- Question generation prompts by difficulty
    difficulty_config JSONB NOT NULL DEFAULT '{}', -- Difficulty distributions and weights
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default exam templates for MVP
INSERT INTO public.exam_templates (exam_type, syllabus_map, prompt_templates, difficulty_config) VALUES
('SSC', 
 '{"General Awareness": ["Current Affairs", "History", "Geography", "Polity"], "Quantitative Aptitude": ["Arithmetic", "Algebra", "Geometry"], "English": ["Grammar", "Vocabulary", "Comprehension"], "Reasoning": ["Logical", "Analytical", "Verbal"]}',
 '{"easy": "Generate easy MCQs for SSC {topic} from: {content}", "medium": "Generate medium difficulty MCQs for SSC {topic} from: {content}", "hard": "Generate challenging MCQs for SSC {topic} from: {content}"}',
 '{"easy": 0.4, "medium": 0.4, "hard": 0.2}'
),
('Banking', 
 '{"Banking Awareness": ["Current Affairs", "Banking Terms", "Financial Awareness"], "Quantitative Aptitude": ["Data Interpretation", "Arithmetic"], "English": ["Grammar", "Comprehension"], "Reasoning": ["Logical", "Puzzles"]}',
 '{"easy": "Generate easy MCQs for Banking {topic} from: {content}", "medium": "Generate medium difficulty MCQs for Banking {topic} from: {content}", "hard": "Generate challenging MCQs for Banking {topic} from: {content}"}',
 '{"easy": 0.3, "medium": 0.5, "hard": 0.2}'
),
('UPSC', 
 '{"History": ["Ancient", "Medieval", "Modern"], "Geography": ["Physical", "Human", "Indian"], "Polity": ["Constitution", "Governance"], "Economy": ["Indian Economy", "Development"], "Environment": ["Ecology", "Climate Change"], "Current Affairs": ["National", "International"]}',
 '{"easy": "Generate easy MCQs for UPSC {topic} from: {content}", "medium": "Generate medium difficulty MCQs for UPSC {topic} from: {content}", "hard": "Generate UPSC-level challenging MCQs for {topic} from: {content}"}',
 '{"easy": 0.2, "medium": 0.5, "hard": 0.3}'
),
('JEE',
 '{"Physics": ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics"], "Chemistry": ["Physical", "Organic", "Inorganic"], "Mathematics": ["Algebra", "Calculus", "Trigonometry", "Coordinate Geometry"]}',
 '{"easy": "Generate easy MCQs for JEE {topic} from: {content}", "medium": "Generate medium difficulty MCQs for JEE {topic} from: {content}", "hard": "Generate JEE Advanced level MCQs for {topic} from: {content}"}',
 '{"easy": 0.3, "medium": 0.4, "hard": 0.3}'
),
('NEET',
 '{"Physics": ["Mechanics", "Thermodynamics", "Modern Physics"], "Chemistry": ["Physical", "Organic", "Inorganic"], "Biology": ["Botany", "Zoology", "Human Physiology", "Genetics"]}',
 '{"easy": "Generate easy MCQs for NEET {topic} from: {content}", "medium": "Generate medium difficulty MCQs for NEET {topic} from: {content}", "hard": "Generate NEET-level challenging MCQs for {topic} from: {content}"}',
 '{"easy": 0.3, "medium": 0.4, "hard": 0.3}'
);

-- Create user_test_sessions table for Step 6 (Test Taking) - autosave answers, bookmarks
CREATE TABLE IF NOT EXISTS public.user_test_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE NOT NULL,
    answers JSONB DEFAULT '{}', -- {question_id: selected_option}
    bookmarks JSONB DEFAULT '[]', -- [question_id, ...]
    current_question INTEGER DEFAULT 1,
    time_spent INTEGER DEFAULT 0, -- in seconds
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, test_id)
);

-- Create ratings table for Step 9 (Feedback)
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table for Step 10 (Account/Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'in_app')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    metadata JSONB DEFAULT '{}',
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table for Razorpay payments (Step 10)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    plan TEXT NOT NULL CHECK (plan IN ('Free', 'Premium', 'Pro')),
    razorpay_subscription_id TEXT UNIQUE,
    razorpay_customer_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
    amount_paid DECIMAL(10,2),
    currency TEXT DEFAULT 'INR',
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add plan limits tracking
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS current_plan TEXT DEFAULT 'Free' CHECK (current_plan IN ('Free', 'Premium', 'Pro')),
ADD COLUMN IF NOT EXISTS tests_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tests_limit INTEGER DEFAULT 1; -- Free: 1, Premium: unlimited (-1), Pro: unlimited (-1)

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_test_sessions_user_id ON public.user_test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_sessions_test_id ON public.user_test_sessions(test_id);
CREATE INDEX IF NOT EXISTS idx_user_test_sessions_status ON public.user_test_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Enable RLS (Row Level Security) on new tables
ALTER TABLE public.exam_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view their own test sessions" ON public.user_test_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test sessions" ON public.user_test_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test sessions" ON public.user_test_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ratings" ON public.ratings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ratings" ON public.ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Exam templates are public (read-only)
CREATE POLICY "Anyone can view exam templates" ON public.exam_templates
    FOR SELECT USING (true);

-- Function to reset monthly test usage (for cron job)
CREATE OR REPLACE FUNCTION reset_monthly_test_usage()
RETURNS void AS $$
BEGIN
    UPDATE public.users 
    SET tests_used_this_month = 0
    WHERE current_plan = 'Free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify migration
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'New columns added: users.goals, users.current_plan, users.tests_used_this_month, users.tests_limit';
    RAISE NOTICE 'New tables created: exam_templates, user_test_sessions, ratings, notifications, subscriptions';
    RAISE NOTICE 'RLS policies enabled on all new tables';
END $$;

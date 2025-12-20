-- MVP Phase 1 Enhancements for MockifyAI
-- Addresses critical gaps: Payments, Onboarding Goals, Feedback Loops, Notifications
-- Low effort, high impact additions for 100 users in 90 days

-- =============================================================================
-- 1. PAYMENTS & SUBSCRIPTION MANAGEMENT (Critical for ₹25k MRR goal)
-- =============================================================================

-- Subscription tier enum
CREATE TYPE subscription_tier_enum AS ENUM ('free', 'premium', 'pro');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'cancelled', 'expired', 'trial');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Add subscription fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier_enum DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status subscription_status_enum DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS monthly_test_limit INTEGER DEFAULT 1, -- Free: 1, Premium: Unlimited
ADD COLUMN IF NOT EXISTS monthly_tests_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_goals JSONB DEFAULT '{}', -- {target_score: 80, target_date: "2025-06-01", weak_areas: [...]}
ADD COLUMN IF NOT EXISTS weak_area_improvement_plan JSONB DEFAULT '{}'; -- AI-generated revision plan

-- Create subscriptions table for payment tracking
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    tier subscription_tier_enum NOT NULL,
    price DECIMAL(10,2) NOT NULL, -- Amount in INR
    currency TEXT DEFAULT 'INR',
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    razorpay_subscription_id TEXT UNIQUE, -- Razorpay subscription ID
    razorpay_plan_id TEXT,
    status subscription_status_enum DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table for transaction history
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    razorpay_payment_id TEXT UNIQUE,
    razorpay_order_id TEXT,
    payment_method TEXT, -- card, upi, netbanking, wallet
    status payment_status_enum DEFAULT 'pending',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription usage tracking
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    resource_type TEXT NOT NULL, -- 'test_generation', 'ocr_processing', 'ai_questions'
    resource_id UUID, -- Reference to test_id or material_id
    credits_used INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 2. QUESTION QUALITY FEEDBACK & RATINGS
-- =============================================================================

-- Question ratings for feedback loop
CREATE TABLE IF NOT EXISTS public.question_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES public.test_questions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars
    is_relevant BOOLEAN, -- Question matches topic
    is_clear BOOLEAN, -- Question is clear and understandable
    difficulty_feedback TEXT CHECK (difficulty_feedback IN ('too_easy', 'just_right', 'too_hard')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_id, user_id)
);

-- Track shared test results for social features
CREATE TABLE IF NOT EXISTS public.shared_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    result_id UUID REFERENCES public.test_results(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    share_token TEXT UNIQUE NOT NULL, -- Public token for sharing
    share_type TEXT DEFAULT 'public' CHECK (share_type IN ('public', 'friends', 'mentor')),
    view_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. NOTIFICATIONS & COMMUNICATION
-- =============================================================================

CREATE TYPE notification_type_enum AS ENUM (
    'test_completed', 
    'weak_area_detected', 
    'improvement_suggestion',
    'subscription_expiring',
    'payment_failed',
    'new_discussion_reply',
    'achievement_unlocked',
    'test_reminder'
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type notification_type_enum NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT, -- Link to relevant page
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- WhatsApp/Email preferences
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "email": true,
    "push": true,
    "whatsapp": false,
    "test_reminders": true,
    "weak_area_alerts": true,
    "subscription_alerts": true,
    "community_updates": false
}'::jsonb;

-- =============================================================================
-- 4. ENHANCED ANALYTICS & WEAK AREA TRACKING
-- =============================================================================

-- Detailed topic-wise performance
CREATE TABLE IF NOT EXISTS public.topic_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    exam_type exam_type_enum NOT NULL,
    topic TEXT NOT NULL,
    subtopic TEXT,
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    average_time_per_question INTEGER DEFAULT 0, -- seconds
    difficulty_accuracy JSONB DEFAULT '{"easy": 0, "medium": 0, "hard": 0}'::jsonb, -- % correct by difficulty
    last_practiced TIMESTAMP WITH TIME ZONE,
    is_weak_area BOOLEAN DEFAULT false,
    improvement_trend JSONB DEFAULT '[]'::jsonb, -- [{date, score}] for trend analysis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, exam_type, topic, subtopic)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_id ON public.subscriptions(razorpay_subscription_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_resource_type ON public.usage_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_question_ratings_question_id ON public.question_ratings(question_id);
CREATE INDEX IF NOT EXISTS idx_question_ratings_user_id ON public.question_ratings(user_id);

CREATE INDEX IF NOT EXISTS idx_shared_results_share_token ON public.shared_results(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_results_user_id ON public.shared_results(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_topic_analytics_user_id ON public.topic_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_analytics_exam_type ON public.topic_analytics(exam_type);
CREATE INDEX IF NOT EXISTS idx_topic_analytics_is_weak_area ON public.topic_analytics(is_weak_area);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update updated_at timestamps
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
BEFORE UPDATE ON public.subscriptions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topic_analytics_updated_at ON public.topic_analytics;
CREATE TRIGGER update_topic_analytics_updated_at 
BEFORE UPDATE ON public.topic_analytics 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Reset monthly test usage on subscription renewal
CREATE OR REPLACE FUNCTION reset_monthly_test_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_period_start > OLD.current_period_start THEN
        UPDATE public.users 
        SET monthly_tests_used = 0 
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reset_test_usage ON public.subscriptions;
CREATE TRIGGER trigger_reset_test_usage 
AFTER UPDATE ON public.subscriptions 
FOR EACH ROW 
EXECUTE FUNCTION reset_monthly_test_usage();

-- Auto-identify weak areas after test completion
CREATE OR REPLACE FUNCTION identify_weak_areas()
RETURNS TRIGGER AS $$
DECLARE
    v_topic_scores JSONB;
    v_topic TEXT;
    v_score DECIMAL;
BEGIN
    -- Extract topic-wise scores from test result
    v_topic_scores := NEW.topic_wise_score;
    
    -- Loop through each topic and update analytics
    FOR v_topic, v_score IN SELECT * FROM jsonb_each_text(v_topic_scores)
    LOOP
        -- Mark as weak area if score < 50%
        INSERT INTO public.topic_analytics (
            user_id,
            exam_type,
            topic,
            questions_attempted,
            questions_correct,
            is_weak_area,
            last_practiced
        )
        SELECT 
            NEW.user_id,
            mt.exam_type,
            v_topic,
            1,
            CASE WHEN v_score::DECIMAL >= 50 THEN 1 ELSE 0 END,
            v_score::DECIMAL < 50,
            NEW.completed_at
        FROM public.mock_tests mt
        WHERE mt.id = NEW.test_id
        ON CONFLICT (user_id, exam_type, topic, subtopic)
        DO UPDATE SET
            questions_attempted = topic_analytics.questions_attempted + 1,
            questions_correct = topic_analytics.questions_correct + CASE WHEN v_score::DECIMAL >= 50 THEN 1 ELSE 0 END,
            is_weak_area = (topic_analytics.questions_correct::DECIMAL / topic_analytics.questions_attempted::DECIMAL * 100) < 50,
            last_practiced = NEW.completed_at,
            updated_at = NOW();
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_identify_weak_areas ON public.test_results;
CREATE TRIGGER trigger_identify_weak_areas 
AFTER INSERT ON public.test_results 
FOR EACH ROW 
EXECUTE FUNCTION identify_weak_areas();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_analytics ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
DO $$ BEGIN
    CREATE POLICY "Users can view own subscriptions" ON public.subscriptions 
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Payments policies
DO $$ BEGIN
    CREATE POLICY "Users can view own payments" ON public.payments 
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Usage logs policies
DO $$ BEGIN
    CREATE POLICY "Users can view own usage" ON public.usage_logs 
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Question ratings policies
DO $$ BEGIN
    CREATE POLICY "Users can view all ratings" ON public.question_ratings 
    FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can rate questions" ON public.question_ratings 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own ratings" ON public.question_ratings 
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Shared results policies
DO $$ BEGIN
    CREATE POLICY "Anyone can view shared results" ON public.shared_results 
    FOR SELECT USING (true); -- Public sharing
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can share own results" ON public.shared_results 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notifications policies
DO $$ BEGIN
    CREATE POLICY "Users can view own notifications" ON public.notifications 
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own notifications" ON public.notifications 
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Topic analytics policies
DO $$ BEGIN
    CREATE POLICY "Users can view own analytics" ON public.topic_analytics 
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own analytics" ON public.topic_analytics 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own analytics" ON public.topic_analytics 
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- SUBSCRIPTION TIERS & PRICING (India-focused)
-- =============================================================================

-- Create subscription plans reference table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier subscription_tier_enum NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_quarterly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB NOT NULL, -- {tests_per_month: "unlimited", ai_explanations: true, ...}
    test_limit INTEGER, -- NULL for unlimited
    is_active BOOLEAN DEFAULT true,
    razorpay_plan_id_monthly TEXT,
    razorpay_plan_id_quarterly TEXT,
    razorpay_plan_id_yearly TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default pricing plans
INSERT INTO public.subscription_plans (tier, name, price_monthly, price_quarterly, price_yearly, features, test_limit, is_active)
VALUES
('free', 'Free Plan', 0, 0, 0, '{
    "tests_per_month": 1,
    "questions_per_test": 10,
    "ai_explanations": false,
    "community_access": true,
    "analytics": "basic",
    "ocr_uploads": 1,
    "hindi_support": false
}'::jsonb, 1, true),
('premium', 'Premium Plan', 299, 799, 2999, '{
    "tests_per_month": "unlimited",
    "questions_per_test": 50,
    "ai_explanations": true,
    "community_access": true,
    "analytics": "advanced",
    "ocr_uploads": "unlimited",
    "hindi_support": true,
    "weak_area_analysis": true,
    "improvement_plans": true,
    "priority_support": false
}'::jsonb, NULL, true),
('pro', 'Pro Plan', 499, 1299, 4999, '{
    "tests_per_month": "unlimited",
    "questions_per_test": 100,
    "ai_explanations": true,
    "community_access": true,
    "analytics": "premium",
    "ocr_uploads": "unlimited",
    "hindi_support": true,
    "weak_area_analysis": true,
    "improvement_plans": true,
    "priority_support": true,
    "custom_test_templates": true,
    "mentor_sharing": true,
    "whatsapp_support": true
}'::jsonb, NULL, true)
ON CONFLICT (tier) DO NOTHING;

-- Enable RLS for subscription plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "All users can view subscription plans" ON public.subscription_plans 
    FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Check if user can create test (based on subscription limits)
CREATE OR REPLACE FUNCTION can_create_test(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_tier subscription_tier_enum;
    v_tests_used INTEGER;
    v_test_limit INTEGER;
BEGIN
    SELECT subscription_tier, monthly_tests_used, monthly_test_limit
    INTO v_tier, v_tests_used, v_test_limit
    FROM public.users
    WHERE id = p_user_id;
    
    -- Unlimited for premium/pro
    IF v_tier IN ('premium', 'pro') THEN
        RETURN true;
    END IF;
    
    -- Check limit for free tier
    RETURN v_tests_used < v_test_limit;
END;
$$ LANGUAGE plpgsql;

-- Increment test usage counter
CREATE OR REPLACE FUNCTION increment_test_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users 
    SET monthly_tests_used = monthly_tests_used + 1 
    WHERE id = NEW.user_id;
    
    -- Log usage
    INSERT INTO public.usage_logs (user_id, resource_type, resource_id, credits_used)
    VALUES (NEW.user_id, 'test_generation', NEW.id, 1);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_test_usage ON public.mock_tests;
CREATE TRIGGER trigger_increment_test_usage 
AFTER INSERT ON public.mock_tests 
FOR EACH ROW 
EXECUTE FUNCTION increment_test_usage();

-- Generate AI improvement plan for weak areas
CREATE OR REPLACE FUNCTION generate_improvement_plan(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_weak_topics TEXT[];
    v_plan JSONB := '[]'::jsonb;
BEGIN
    -- Get weak areas
    SELECT array_agg(topic)
    INTO v_weak_topics
    FROM public.topic_analytics
    WHERE user_id = p_user_id AND is_weak_area = true
    LIMIT 5;
    
    -- Generate simple plan structure (AI will enhance this)
    IF v_weak_topics IS NOT NULL THEN
        FOR i IN 1..array_length(v_weak_topics, 1) LOOP
            v_plan := v_plan || jsonb_build_object(
                'topic', v_weak_topics[i],
                'priority', 'high',
                'recommended_tests', 3,
                'study_hours', 2,
                'resources', jsonb_build_array()
            );
        END LOOP;
    END IF;
    
    RETURN v_plan;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.subscriptions IS 'Tracks user subscription status and billing cycles';
COMMENT ON TABLE public.payments IS 'Payment transaction history with Razorpay integration';
COMMENT ON TABLE public.usage_logs IS 'Tracks resource usage for rate limiting and analytics';
COMMENT ON TABLE public.question_ratings IS 'User feedback on question quality for AI improvement';
COMMENT ON TABLE public.shared_results IS 'Enables social sharing of test results with mentors/peers';
COMMENT ON TABLE public.notifications IS 'In-app and push notifications for user engagement';
COMMENT ON TABLE public.topic_analytics IS 'Granular topic-wise performance tracking for weak area identification';
COMMENT ON TABLE public.subscription_plans IS 'Pricing tiers and feature flags for subscription management';

COMMENT ON FUNCTION can_create_test IS 'Checks if user has remaining test credits based on subscription tier';
COMMENT ON FUNCTION generate_improvement_plan IS 'Generates structured improvement plan for weak topics (to be enhanced by AI)';

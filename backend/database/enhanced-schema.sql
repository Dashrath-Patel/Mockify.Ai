-- Enhanced Schema for MockifyAI Platform
-- This schema adds support for progress tracking, benchmarking, and community features

-- Add new columns to users table for exam selection and onboarding
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS selected_exam exam_type_enum,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_language language_enum DEFAULT 'English',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- Create study_materials table (enhanced version of materials)
CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    exam_type exam_type_enum NOT NULL,
    topic TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    extracted_text TEXT,
    structured_content JSONB, -- Organized content by topics/subtopics
    ocr_confidence DECIMAL(5,2),
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mock_tests table (comprehensive test management)
CREATE TABLE IF NOT EXISTS public.mock_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    exam_type exam_type_enum NOT NULL,
    topic TEXT, -- NULL for full syllabus tests
    title TEXT NOT NULL,
    description TEXT,
    is_ai_generated BOOLEAN DEFAULT true,
    test_type TEXT NOT NULL CHECK (test_type IN ('full_syllabus', 'topic_specific', 'custom')),
    difficulty difficulty_enum DEFAULT 'medium',
    total_questions INTEGER NOT NULL,
    time_limit INTEGER NOT NULL DEFAULT 3600, -- in seconds
    status test_status_enum DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_questions table
CREATE TABLE IF NOT EXISTS public.test_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE NOT NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty difficulty_enum NOT NULL,
    options JSONB NOT NULL, -- Array of {text: string, isCorrect: boolean}
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    marks INTEGER DEFAULT 1,
    negative_marks DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(test_id, question_number)
);

-- Create test_results table
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    score DECIMAL(6,2) NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    incorrect_answers INTEGER NOT NULL DEFAULT 0,
    unattempted_answers INTEGER NOT NULL DEFAULT 0,
    time_taken INTEGER NOT NULL, -- in seconds
    user_answers JSONB NOT NULL DEFAULT '{}', -- {question_id: selected_option}
    question_analytics JSONB NOT NULL DEFAULT '{}', -- Per-question time, difficulty
    topic_wise_score JSONB NOT NULL DEFAULT '{}', -- Score breakdown by topic
    percentile DECIMAL(5,2), -- User's percentile among all test takers
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    exam_type exam_type_enum NOT NULL,
    topic TEXT NOT NULL,
    tests_attempted INTEGER DEFAULT 0,
    average_score DECIMAL(6,2) DEFAULT 0,
    highest_score DECIMAL(6,2) DEFAULT 0,
    lowest_score DECIMAL(6,2) DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- in seconds
    accuracy_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    strong_topics TEXT[] DEFAULT '{}',
    weak_topics TEXT[] DEFAULT '{}',
    last_attempted TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, exam_type, topic)
);

-- Create benchmarks table (aggregate performance data)
CREATE TABLE IF NOT EXISTS public.benchmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_type exam_type_enum NOT NULL,
    topic TEXT NOT NULL,
    test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE,
    total_attempts INTEGER DEFAULT 0,
    average_score DECIMAL(6,2) DEFAULT 0,
    median_score DECIMAL(6,2) DEFAULT 0,
    highest_score DECIMAL(6,2) DEFAULT 0,
    average_time INTEGER DEFAULT 0, -- in seconds
    difficulty_rating DECIMAL(3,2) DEFAULT 0, -- out of 5
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exam_type, topic, test_id)
);

-- Create discussions table (community feature)
CREATE TABLE IF NOT EXISTS public.discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    exam_type exam_type_enum NOT NULL,
    topic TEXT,
    tags TEXT[] DEFAULT '{}',
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create discussion_comments table
CREATE TABLE IF NOT EXISTS public.discussion_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    parent_comment_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_solution BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create discussion_likes table
CREATE TABLE IF NOT EXISTS public.discussion_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(discussion_id, user_id),
    UNIQUE(comment_id, user_id),
    CHECK ((discussion_id IS NOT NULL AND comment_id IS NULL) OR (discussion_id IS NULL AND comment_id IS NOT NULL))
);

-- Create shared_questions table (peer-to-peer learning)
CREATE TABLE IF NOT EXISTS public.shared_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    topic TEXT NOT NULL,
    exam_type exam_type_enum NOT NULL,
    difficulty difficulty_enum NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    source TEXT, -- 'user_created' or 'ai_generated'
    is_verified BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    uses_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    points_earned INTEGER DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create exam_templates table
CREATE TABLE IF NOT EXISTS public.exam_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_type exam_type_enum NOT NULL,
    syllabus JSONB NOT NULL, -- Detailed syllabus structure
    total_topics INTEGER NOT NULL,
    difficulty_distribution JSONB NOT NULL, -- {easy: %, medium: %, hard: %}
    time_per_question INTEGER DEFAULT 60, -- seconds
    passing_marks DECIMAL(5,2),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_materials_user_id ON public.study_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_exam_type ON public.study_materials(exam_type);
CREATE INDEX IF NOT EXISTS idx_study_materials_topic ON public.study_materials(topic);

CREATE INDEX IF NOT EXISTS idx_mock_tests_user_id ON public.mock_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_tests_exam_type ON public.mock_tests(exam_type);
CREATE INDEX IF NOT EXISTS idx_mock_tests_status ON public.mock_tests(status);

CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON public.test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_topic ON public.test_questions(topic);

CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON public.test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_completed_at ON public.test_results(completed_at);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_exam_type ON public.user_progress(exam_type);

CREATE INDEX IF NOT EXISTS idx_benchmarks_exam_type ON public.benchmarks(exam_type);
CREATE INDEX IF NOT EXISTS idx_benchmarks_topic ON public.benchmarks(topic);

CREATE INDEX IF NOT EXISTS idx_discussions_exam_type ON public.discussions(exam_type);
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON public.discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON public.discussions(created_at);

CREATE INDEX IF NOT EXISTS idx_discussion_comments_discussion_id ON public.discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_user_id ON public.discussion_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_shared_questions_exam_type ON public.shared_questions(exam_type);
CREATE INDEX IF NOT EXISTS idx_shared_questions_topic ON public.shared_questions(topic);

-- Create triggers for updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_study_materials_updated_at ON public.study_materials;
CREATE TRIGGER update_study_materials_updated_at BEFORE UPDATE ON public.study_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mock_tests_updated_at ON public.mock_tests;
CREATE TRIGGER update_mock_tests_updated_at BEFORE UPDATE ON public.mock_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_benchmarks_updated_at ON public.benchmarks;
CREATE TRIGGER update_benchmarks_updated_at BEFORE UPDATE ON public.benchmarks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discussions_updated_at ON public.discussions;
CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON public.discussions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discussion_comments_updated_at ON public.discussion_comments;
CREATE TRIGGER update_discussion_comments_updated_at BEFORE UPDATE ON public.discussion_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_materials
DO $$ BEGIN
    CREATE POLICY "Users can view own study materials" ON public.study_materials FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own study materials" ON public.study_materials FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own study materials" ON public.study_materials FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own study materials" ON public.study_materials FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for mock_tests
DO $$ BEGIN
    CREATE POLICY "Users can view own mock tests" ON public.mock_tests FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own mock tests" ON public.mock_tests FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own mock tests" ON public.mock_tests FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own mock tests" ON public.mock_tests FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for test_questions
DO $$ BEGIN
    CREATE POLICY "Users can view questions for own tests" ON public.test_questions FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.mock_tests WHERE mock_tests.id = test_questions.test_id AND mock_tests.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert questions for own tests" ON public.test_questions FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.mock_tests WHERE mock_tests.id = test_questions.test_id AND mock_tests.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for test_results
DO $$ BEGIN
    CREATE POLICY "Users can view own test results" ON public.test_results FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own test results" ON public.test_results FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for user_progress
DO $$ BEGIN
    CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for benchmarks (read-only for all authenticated users)
DO $$ BEGIN
    CREATE POLICY "All users can view benchmarks" ON public.benchmarks FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for discussions (public read, owner write)
DO $$ BEGIN
    CREATE POLICY "All users can view discussions" ON public.discussions FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own discussions" ON public.discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own discussions" ON public.discussions FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own discussions" ON public.discussions FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for discussion_comments
DO $$ BEGIN
    CREATE POLICY "All users can view comments" ON public.discussion_comments FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own comments" ON public.discussion_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own comments" ON public.discussion_comments FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own comments" ON public.discussion_comments FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for discussion_likes
DO $$ BEGIN
    CREATE POLICY "Users can view all likes" ON public.discussion_likes FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own likes" ON public.discussion_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own likes" ON public.discussion_likes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for shared_questions
DO $$ BEGIN
    CREATE POLICY "All users can view shared questions" ON public.shared_questions FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own shared questions" ON public.shared_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own shared questions" ON public.shared_questions FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for user_achievements
DO $$ BEGIN
    CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "System can insert achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for exam_templates (read-only for all)
DO $$ BEGIN
    CREATE POLICY "All users can view exam templates" ON public.exam_templates FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Functions for automated calculations

-- Function to update user progress after test completion
CREATE OR REPLACE FUNCTION update_user_progress_on_test_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert progress record
    INSERT INTO public.user_progress (
        user_id,
        exam_type,
        topic,
        tests_attempted,
        average_score,
        highest_score,
        lowest_score,
        total_time_spent,
        last_attempted
    )
    SELECT 
        NEW.user_id,
        mt.exam_type,
        COALESCE(mt.topic, 'Full Syllabus'),
        1,
        NEW.score,
        NEW.score,
        NEW.score,
        NEW.time_taken,
        NEW.completed_at
    FROM public.mock_tests mt
    WHERE mt.id = NEW.test_id
    ON CONFLICT (user_id, exam_type, topic)
    DO UPDATE SET
        tests_attempted = user_progress.tests_attempted + 1,
        average_score = (user_progress.average_score * user_progress.tests_attempted + NEW.score) / (user_progress.tests_attempted + 1),
        highest_score = GREATEST(user_progress.highest_score, NEW.score),
        lowest_score = LEAST(user_progress.lowest_score, NEW.score),
        total_time_spent = user_progress.total_time_spent + NEW.time_taken,
        last_attempted = NEW.completed_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_progress ON public.test_results;
CREATE TRIGGER trigger_update_progress 
AFTER INSERT ON public.test_results 
FOR EACH ROW 
EXECUTE FUNCTION update_user_progress_on_test_completion();

-- Function to update benchmarks
CREATE OR REPLACE FUNCTION update_benchmarks_on_test_completion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.benchmarks (
        exam_type,
        topic,
        test_id,
        total_attempts,
        average_score,
        highest_score,
        average_time
    )
    SELECT 
        mt.exam_type,
        COALESCE(mt.topic, 'Full Syllabus'),
        NEW.test_id,
        1,
        NEW.score,
        NEW.score,
        NEW.time_taken
    FROM public.mock_tests mt
    WHERE mt.id = NEW.test_id
    ON CONFLICT (exam_type, topic, test_id)
    DO UPDATE SET
        total_attempts = benchmarks.total_attempts + 1,
        average_score = (benchmarks.average_score * benchmarks.total_attempts + NEW.score) / (benchmarks.total_attempts + 1),
        highest_score = GREATEST(benchmarks.highest_score, NEW.score),
        average_time = (benchmarks.average_time * benchmarks.total_attempts + NEW.time_taken) / (benchmarks.total_attempts + 1),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_benchmarks ON public.test_results;
CREATE TRIGGER trigger_update_benchmarks 
AFTER INSERT ON public.test_results 
FOR EACH ROW 
EXECUTE FUNCTION update_benchmarks_on_test_completion();

-- Function to calculate percentile
CREATE OR REPLACE FUNCTION calculate_percentile(
    p_test_id UUID,
    p_score DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    v_percentile DECIMAL;
    v_total_scores INTEGER;
    v_scores_below INTEGER;
BEGIN
    -- Count total scores for this test
    SELECT COUNT(*) INTO v_total_scores
    FROM public.test_results
    WHERE test_id = p_test_id;
    
    -- Count scores below the given score
    SELECT COUNT(*) INTO v_scores_below
    FROM public.test_results
    WHERE test_id = p_test_id AND score < p_score;
    
    -- Calculate percentile
    IF v_total_scores > 0 THEN
        v_percentile := (v_scores_below::DECIMAL / v_total_scores::DECIMAL) * 100;
    ELSE
        v_percentile := 0;
    END IF;
    
    RETURN ROUND(v_percentile, 2);
END;
$$ LANGUAGE plpgsql;

-- Insert default exam templates
INSERT INTO public.exam_templates (exam_type, syllabus, total_topics, difficulty_distribution, time_per_question, passing_marks, description, is_active)
VALUES
('UPSC', '{
    "Prelims": {
        "General Studies Paper I": ["History", "Geography", "Polity", "Economy", "Environment", "Science & Technology"],
        "General Studies Paper II": ["Comprehension", "Interpersonal skills", "Logical reasoning", "Analytical ability", "Decision making", "Problem solving"]
    },
    "Mains": {
        "Essay": ["Essay Writing"],
        "General Studies I": ["Indian Heritage and Culture", "History and Geography of the World and Society"],
        "General Studies II": ["Governance, Constitution, Polity, Social Justice and International relations"],
        "General Studies III": ["Technology, Economic Development, Bio diversity, Environment, Security and Disaster Management"],
        "General Studies IV": ["Ethics, Integrity and Aptitude"]
    }
}', 15, '{"easy": 30, "medium": 50, "hard": 20}', 90, 33.0, 'Union Public Service Commission - Civil Services Examination', true),
('JEE', '{
    "Physics": ["Mechanics", "Thermodynamics", "Electrostatics", "Current Electricity", "Magnetism", "Optics", "Modern Physics"],
    "Chemistry": ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry"],
    "Mathematics": ["Algebra", "Calculus", "Coordinate Geometry", "Trigonometry", "Vector & 3D Geometry", "Probability & Statistics"]
}', 13, '{"easy": 20, "medium": 50, "hard": 30}', 180, 33.0, 'Joint Entrance Examination - Engineering', true),
('NEET', '{
    "Physics": ["Mechanics", "Thermodynamics", "Electrodynamics", "Optics", "Modern Physics"],
    "Chemistry": ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry"],
    "Biology": ["Botany", "Zoology", "Human Physiology", "Genetics", "Ecology"]
}', 11, '{"easy": 25, "medium": 50, "hard": 25}', 180, 50.0, 'National Eligibility cum Entrance Test - Medical', true)
ON CONFLICT DO NOTHING;

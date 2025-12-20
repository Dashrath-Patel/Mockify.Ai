-- Create custom types
CREATE TYPE exam_type_enum AS ENUM ('UPSC', 'Banking', 'SSC', 'NEET', 'JEE', 'CAT', 'GATE', 'Other');
CREATE TYPE language_enum AS ENUM ('English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Other');
CREATE TYPE difficulty_enum AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE test_status_enum AS ENUM ('draft', 'active', 'completed');

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    exam_type exam_type_enum,
    language language_enum DEFAULT 'English',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create materials table for uploaded study content
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    extracted_text TEXT,
    ocr_confidence DECIMAL(5,2),
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tests table for mock test configurations
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    status test_status_enum DEFAULT 'draft',
    total_questions INTEGER DEFAULT 0,
    time_limit INTEGER NOT NULL DEFAULT 3600, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table for generated questions
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
    question_number INTEGER NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of options
    correct_answer TEXT NOT NULL,
    topic TEXT,
    difficulty difficulty_enum DEFAULT 'medium',
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create results table for test attempts
CREATE TABLE IF NOT EXISTS public.results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    time_taken INTEGER NOT NULL, -- in seconds
    answers JSONB NOT NULL DEFAULT '{}', -- User's answers
    analytics JSONB NOT NULL DEFAULT '{}',
    feedback TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_test_sessions for tracking active test sessions
CREATE TABLE IF NOT EXISTS public.user_test_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    current_question INTEGER DEFAULT 1,
    answers JSONB DEFAULT '{}',
    bookmarked_questions INTEGER[] DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON public.materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_processing_status ON public.materials(processing_status);
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON public.tests(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON public.tests(status);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON public.questions(test_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_results_test_id ON public.results(test_id);
CREATE INDEX IF NOT EXISTS idx_results_user_id ON public.results(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_sessions_user_id ON public.user_test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_sessions_test_id ON public.user_test_sessions(test_id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON public.tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Materials policies
CREATE POLICY "Users can view own materials" ON public.materials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own materials" ON public.materials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own materials" ON public.materials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own materials" ON public.materials FOR DELETE USING (auth.uid() = user_id);

-- Tests policies
CREATE POLICY "Users can view own tests" ON public.tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tests" ON public.tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tests" ON public.tests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tests" ON public.tests FOR DELETE USING (auth.uid() = user_id);

-- Questions policies (users can view questions for their tests)
CREATE POLICY "Users can view questions for own tests" ON public.questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tests WHERE tests.id = questions.test_id AND tests.user_id = auth.uid())
);
CREATE POLICY "Users can insert questions for own tests" ON public.questions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tests WHERE tests.id = questions.test_id AND tests.user_id = auth.uid())
);

-- Results policies
CREATE POLICY "Users can view own results" ON public.results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON public.results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Test sessions policies
CREATE POLICY "Users can view own test sessions" ON public.user_test_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own test sessions" ON public.user_test_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own test sessions" ON public.user_test_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Create storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public) VALUES ('study-materials', 'study-materials', false);

-- Create storage policies
CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload files" ON storage.objects FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
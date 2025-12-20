-- Cleanup Script: Drop Old Tables
-- Use this to remove old table structures before running enhanced-schema.sql
-- WARNING: This will delete all data in these tables!

-- Drop old tables if they exist (in correct order due to foreign key constraints)

-- Drop triggers first
DROP TRIGGER IF EXISTS update_materials_updated_at ON public.materials;
DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
DROP TRIGGER IF EXISTS update_tests_updated_at ON public.tests;
DROP TRIGGER IF EXISTS update_results_updated_at ON public.results;

-- Drop old tables (order matters due to foreign key constraints)
DROP TABLE IF EXISTS public.results CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.tests CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;

-- Drop old enum types if they exist
DROP TYPE IF EXISTS public.exam_type CASCADE;
DROP TYPE IF EXISTS public.difficulty_level CASCADE;
DROP TYPE IF EXISTS public.test_status CASCADE;

-- Note: The enhanced schema creates new enum types:
-- - exam_type_enum
-- - difficulty_enum
-- - test_status_enum
-- - language_enum

-- Verify cleanup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'materials') THEN
        RAISE NOTICE '✅ Old "materials" table removed successfully';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tests') THEN
        RAISE NOTICE '✅ Old "tests" table removed successfully';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
        RAISE NOTICE '✅ Old "questions" table removed successfully';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'results') THEN
        RAISE NOTICE '✅ Old "results" table removed successfully';
    END IF;
    
    RAISE NOTICE '🎉 Cleanup complete! You can now run enhanced-schema.sql';
END $$;

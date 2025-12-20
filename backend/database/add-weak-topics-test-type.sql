-- Migration: Add weak_topics as a valid test_type
-- This allows weak topics practice tests to be properly categorized in the database

-- Update the check constraint to include 'weak_topics' as a valid test type
ALTER TABLE public.mock_tests 
DROP CONSTRAINT IF EXISTS mock_tests_test_type_check;

ALTER TABLE public.mock_tests 
ADD CONSTRAINT mock_tests_test_type_check 
CHECK (test_type IN ('full_syllabus', 'topic_specific', 'custom', 'weak_topics'));

-- Add a comment explaining the test types
COMMENT ON COLUMN public.mock_tests.test_type IS 
'Test types: full_syllabus (all topics), topic_specific (user selected topics), custom (user created), weak_topics (AI generated for improvement)';

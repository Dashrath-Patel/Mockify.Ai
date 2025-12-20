-- Clean up all existing materials and tests to start fresh
-- This removes all uploaded materials, tests, questions, and results

-- Delete test results first (has foreign keys)
DELETE FROM public.test_results;

-- Delete questions (has foreign key to tests)
DELETE FROM public.questions;

-- Delete tests
DELETE FROM public.tests;

-- Delete materials (files and their data)
DELETE FROM public.materials;

-- Reset sequences if needed
-- ALTER SEQUENCE IF EXISTS materials_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS tests_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS questions_id_seq RESTART WITH 1;

-- Show counts to confirm cleanup
SELECT 
    (SELECT COUNT(*) FROM public.materials) as materials_count,
    (SELECT COUNT(*) FROM public.tests) as tests_count,
    (SELECT COUNT(*) FROM public.questions) as questions_count,
    (SELECT COUNT(*) FROM public.test_results) as results_count;
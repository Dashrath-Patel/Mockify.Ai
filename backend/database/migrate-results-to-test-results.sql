-- Check what tables exist and migrate data from 'results' to 'test_results'

-- First, let's see what data is in the 'results' table (if it exists)
-- Run this query first to check:
-- SELECT * FROM results LIMIT 5;

-- If results table exists with data, migrate it to test_results:
-- Note: Only run this if the results table exists and has data

-- Option 1: If 'results' table exists and references 'tests' table
INSERT INTO test_results (id, test_id, user_id, answers, score, total_questions, correct_answers, time_spent, completed_at, created_at)
SELECT 
    r.id,
    r.test_id,
    r.user_id,
    r.answers,
    r.score,
    r.total_questions,
    r.correct_answers,
    COALESCE(r.time_taken, r.time_spent, 0) as time_spent,
    r.completed_at,
    r.created_at
FROM results r
WHERE r.test_id IN (SELECT id FROM mock_tests)  -- Only migrate results for mock_tests
ON CONFLICT (id) DO NOTHING;  -- Skip if already exists

-- Option 2: If your tests are in 'tests' table but should be in 'mock_tests'
-- First check if tests table has different data than mock_tests:
-- SELECT COUNT(*) FROM tests WHERE id NOT IN (SELECT id FROM mock_tests);

-- If you have results referencing 'tests' table that don't exist in mock_tests,
-- you might need to check the actual test IDs:
-- SELECT DISTINCT r.test_id, t.title 
-- FROM results r 
-- LEFT JOIN tests t ON r.test_id = t.id 
-- WHERE r.user_id = '0f41c7ab-ea1b-44b9-98a4-f7a33b340366';

-- After migration, verify the data:
SELECT 
    COUNT(*) as total_test_results,
    user_id,
    MIN(completed_at) as first_test,
    MAX(completed_at) as last_test,
    AVG(score) as avg_score
FROM test_results
WHERE user_id = '0f41c7ab-ea1b-44b9-98a4-f7a33b340366'
GROUP BY user_id;

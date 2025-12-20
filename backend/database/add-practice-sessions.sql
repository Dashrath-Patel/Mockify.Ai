-- Adaptive Practice Sessions Table
-- Tracks personalized practice sessions for weak topic improvement

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weak_topics JSONB NOT NULL DEFAULT '[]',
  questions_count INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  topic_results JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON practice_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own practice sessions
CREATE POLICY "Users can read own practice sessions"
ON practice_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own practice sessions
CREATE POLICY "Users can insert own practice sessions"
ON practice_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own practice sessions
CREATE POLICY "Users can update own practice sessions"
ON practice_sessions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own practice sessions
CREATE POLICY "Users can delete own practice sessions"
ON practice_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Service role bypass (for API operations)
CREATE POLICY "Service role has full access to practice sessions"
ON practice_sessions FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE practice_sessions IS 'Stores adaptive practice sessions focused on weak topics';
COMMENT ON COLUMN practice_sessions.weak_topics IS 'Array of weak topics analyzed for this session';
COMMENT ON COLUMN practice_sessions.topic_results IS 'Performance breakdown by topic for this session';

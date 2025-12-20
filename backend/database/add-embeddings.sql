-- ============================================
-- Add Semantic Search with pgvector
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to study_materials (384 dimensions for all-MiniLM-L6-v2)
ALTER TABLE study_materials 
ADD COLUMN IF NOT EXISTS embedding vector(384);

-- 3. Create index for fast similarity search using IVFFlat
-- IVFFlat is faster than exact search for large datasets
CREATE INDEX IF NOT EXISTS study_materials_embedding_idx 
ON study_materials 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. Add comment explaining the column
COMMENT ON COLUMN study_materials.embedding IS 'Semantic embedding vector (384-dim) for similarity search using all-MiniLM-L6-v2 model';

-- 5. Create function for semantic search with filters
CREATE OR REPLACE FUNCTION search_similar_materials(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL,
  filter_exam_type text DEFAULT NULL,
  filter_topic text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  topic text,
  file_url text,
  extracted_text text,
  structured_content jsonb,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id,
    sm.topic,
    sm.file_url,
    sm.extracted_text,
    sm.structured_content,
    sm.created_at,
    1 - (sm.embedding <=> query_embedding) as similarity
  FROM study_materials sm
  WHERE 
    (filter_user_id IS NULL OR sm.user_id = filter_user_id)
    AND sm.processing_status = 'completed'
    AND sm.embedding IS NOT NULL
    AND (filter_exam_type IS NULL OR sm.exam_type::text = filter_exam_type)
    AND (filter_topic IS NULL OR sm.topic ILIKE '%' || filter_topic || '%')
    AND 1 - (sm.embedding <=> query_embedding) > match_threshold
  ORDER BY sm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. Add comment to the function
COMMENT ON FUNCTION search_similar_materials IS 'Semantic search using cosine similarity. Returns materials sorted by relevance with similarity scores.';

-- 7. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_similar_materials TO authenticated;

-- 8. Create helper function to update material embeddings (with proper vector casting)
CREATE OR REPLACE FUNCTION update_material_embedding(
  material_id uuid,
  embedding_data text
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cast text to vector and update
  UPDATE study_materials
  SET embedding = embedding_data::vector(384)
  WHERE id = material_id;
  
  -- Check if update succeeded
  IF FOUND THEN
    RETURN QUERY SELECT true, 'Embedding updated successfully'::text;
  ELSE
    RETURN QUERY SELECT false, 'Material not found'::text;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, SQLERRM::text;
END;
$$;

COMMENT ON FUNCTION update_material_embedding IS 'Updates material embedding by casting text to vector type. Returns success status and message.';
GRANT EXECUTE ON FUNCTION update_material_embedding TO authenticated, service_role;

-- Verification queries:
-- SELECT COUNT(*) FROM study_materials WHERE embedding IS NOT NULL;
-- SELECT * FROM search_similar_materials('[0.1, 0.2, ...]'::vector(384), 0.7, 5);

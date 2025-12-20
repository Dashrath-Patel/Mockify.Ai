-- Migration: Update Embeddings from 384 to 768 dimensions
-- Purpose: Upgrade embedding size for better quality
-- Model: sentence-transformers/all-mpnet-base-v2 (768 dims)

-- Step 1: Drop existing vector indexes (they need to be recreated)
DROP INDEX IF EXISTS idx_chunks_embedding;
DROP INDEX IF EXISTS idx_materials_embedding;

-- Step 2: Clear old embeddings (they're incompatible with new dimensions)
-- Must be done before altering column type
DO $$
BEGIN
    UPDATE public.study_materials SET embedding = NULL WHERE embedding IS NOT NULL;
    UPDATE public.document_chunks SET embedding = NULL WHERE embedding IS NOT NULL;
    
    RAISE NOTICE '🗑️  Cleared old 384-dim embeddings';
END $$;

-- Step 3: Alter column types to 512 dimensions
-- For document_chunks table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'document_chunks'
    ) THEN
        ALTER TABLE public.document_chunks 
        ALTER COLUMN embedding TYPE vector(768);
        
        RAISE NOTICE 'Updated document_chunks.embedding to vector(512)';
    END IF;
END $$;

-- For study_materials table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'study_materials'
        AND column_name = 'embedding'
    ) THEN
        ALTER TABLE public.study_materials 
        ALTER COLUMN embedding TYPE vector(768);
        
        RAISE NOTICE 'Updated study_materials.embedding to vector(512)';
    END IF;
END $$;

-- Step 4: Recreate vector indexes with new dimensions
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON public.document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_materials_embedding ON public.study_materials 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Step 5: Update functions to use vector(512)

-- Update search_similar_chunks function
CREATE OR REPLACE FUNCTION search_similar_chunks(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 10,
    filter_user_id uuid DEFAULT NULL,
    filter_material_id uuid DEFAULT NULL
)
RETURNS TABLE (
    chunk_id uuid,
    material_id uuid,
    chunk_index int,
    chunk_text text,
    similarity float,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id AS chunk_id,
        dc.material_id,
        dc.chunk_index,
        dc.chunk_text,
        1 - (dc.embedding <=> query_embedding) AS similarity,
        jsonb_build_object(
            'start_char', dc.start_char,
            'end_char', dc.end_char,
            'char_count', dc.char_count,
            'word_count', dc.word_count,
            'material_name', sm.file_url,
            'material_topic', sm.topic
        ) AS metadata
    FROM public.document_chunks dc
    JOIN public.study_materials sm ON dc.material_id = sm.id
    WHERE 
        (dc.embedding <=> query_embedding) < (1 - match_threshold)
        AND (filter_user_id IS NULL OR dc.user_id = filter_user_id)
        AND (filter_material_id IS NULL OR dc.material_id = filter_material_id)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Update update_chunk_embedding function
CREATE OR REPLACE FUNCTION update_chunk_embedding(
    chunk_id uuid,
    embedding_data text
)
RETURNS TABLE (
    success boolean,
    message text
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.document_chunks
    SET 
        embedding = embedding_data::vector(768),
        updated_at = NOW()
    WHERE id = chunk_id;
    
    IF FOUND THEN
        RETURN QUERY SELECT true, 'Embedding updated successfully';
    ELSE
        RETURN QUERY SELECT false, 'Chunk not found';
    END IF;
END;
$$;

-- Update search_similar_materials function
CREATE OR REPLACE FUNCTION search_similar_materials(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_topic text DEFAULT NULL,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  material_id uuid,
  file_url text,
  topic text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id AS material_id,
    sm.file_url,
    sm.topic,
    1 - (sm.embedding <=> query_embedding) AS similarity
  FROM public.study_materials sm
  WHERE 
    (sm.embedding <=> query_embedding) < (1 - match_threshold)
    AND (filter_topic IS NULL OR sm.topic = filter_topic)
    AND (filter_user_id IS NULL OR sm.user_id = filter_user_id)
  ORDER BY sm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Drop and recreate update_material_embedding function with vector(512)
DROP FUNCTION IF EXISTS update_material_embedding(uuid, text);

CREATE OR REPLACE FUNCTION update_material_embedding(
  material_id uuid,
  embedding_data text
)
RETURNS TABLE (
  success boolean,
  message text
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.study_materials
  SET 
    embedding = embedding_data::vector(768),
    updated_at = NOW()
  WHERE id = material_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT true, 'Embedding updated successfully';
  ELSE
    RETURN QUERY SELECT false, 'Material not found';
  END IF;
END;
$$;

-- Step 6: Update column comments
COMMENT ON COLUMN public.document_chunks.embedding IS 'Vector embedding (768 dims) generated by sentence-transformers/all-mpnet-base-v2';
COMMENT ON COLUMN public.study_materials.embedding IS 'Vector embedding (768 dims) generated by sentence-transformers/all-mpnet-base-v2';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration complete!';
    RAISE NOTICE '📊 Embedding dimensions updated from 384 to 768';
    RAISE NOTICE '🔄 Model: sentence-transformers/all-mpnet-base-v2';
    RAISE NOTICE '⚠️  Note: Existing embeddings are now invalid - re-upload documents to generate new 512-dim embeddings';
END $$;

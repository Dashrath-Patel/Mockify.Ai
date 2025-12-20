-- Migration: Document Chunks with Embeddings
-- Purpose: Store text chunks from PDFs with vector embeddings for semantic search
-- Use Case: Enable chunk-level similarity search for any document type

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Chunk data
    chunk_index INTEGER NOT NULL, -- Position in document (0, 1, 2...)
    chunk_text TEXT NOT NULL, -- Raw text content of this chunk
    
    -- Metadata
    start_char INTEGER NOT NULL, -- Starting position in original document
    end_char INTEGER NOT NULL, -- Ending position in original document
    char_count INTEGER NOT NULL, -- Number of characters
    word_count INTEGER NOT NULL, -- Number of words
    
    -- Vector embedding (768 dimensions for sentence-transformers/all-mpnet-base-v2)
    embedding vector(768),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique chunks per material
    UNIQUE(material_id, chunk_index)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_chunks_material ON public.document_chunks(material_id);
CREATE INDEX IF NOT EXISTS idx_chunks_user ON public.document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_chunks_index ON public.document_chunks(material_id, chunk_index);

-- Vector similarity index (IVFFlat for fast approximate search)
-- This index makes semantic search on chunks very fast
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON public.document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable Row Level Security
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own chunks
CREATE POLICY "Users can view own chunks"
    ON public.document_chunks
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own chunks
CREATE POLICY "Users can insert own chunks"
    ON public.document_chunks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own chunks
CREATE POLICY "Users can update own chunks"
    ON public.document_chunks
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own chunks
CREATE POLICY "Users can delete own chunks"
    ON public.document_chunks
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function: Search similar chunks across all documents
-- Returns chunks most similar to query embedding
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

-- Function: Get all chunks for a specific document (ordered by index)
CREATE OR REPLACE FUNCTION get_document_chunks(
    doc_material_id uuid
)
RETURNS TABLE (
    chunk_id uuid,
    chunk_index int,
    chunk_text text,
    char_count int,
    word_count int,
    has_embedding boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id AS chunk_id,
        dc.chunk_index,
        dc.chunk_text,
        dc.char_count,
        dc.word_count,
        (dc.embedding IS NOT NULL) AS has_embedding
    FROM public.document_chunks dc
    WHERE dc.material_id = doc_material_id
    ORDER BY dc.chunk_index ASC;
END;
$$;

-- Function: Update chunk embedding
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
    -- Update the embedding by casting text to vector
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

-- Add helpful comments
COMMENT ON TABLE public.document_chunks IS 'Stores text chunks from PDFs with vector embeddings for semantic search';
COMMENT ON COLUMN public.document_chunks.embedding IS 'Vector embedding (768 dims) generated by sentence-transformers/all-mpnet-base-v2';
COMMENT ON FUNCTION search_similar_chunks IS 'Search chunks by semantic similarity using cosine distance';
COMMENT ON FUNCTION get_document_chunks IS 'Retrieve all chunks for a document in order';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Document chunks table created successfully!';
    RAISE NOTICE 'Use search_similar_chunks() to find similar content';
    RAISE NOTICE 'Use get_document_chunks() to retrieve all chunks for a document';
END $$;

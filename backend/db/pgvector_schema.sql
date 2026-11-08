-- ==============================================================================
-- CourseAware AI: PostgreSQL + pgvector Schema (text-embedding-004)
-- ==============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Document Chunks with 768-dimensional Gemini text-embedding-004 vectors
CREATE TABLE IF NOT EXISTS public.document_chunks_pgvector (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    document_title TEXT NOT NULL,
    doc_type VARCHAR(64) NOT NULL, -- 'marking_scheme', 'past_question', 'lecture_note', 'handout'
    page_number INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    embedding vector(768), -- Google Gemini text-embedding-004 dimension
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. High-Performance Approximate Nearest Neighbor (ANN) Vector Indexes
-- IVFFlat Index for cosine similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivf
ON public.document_chunks_pgvector
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Metadata Filter Indexes
CREATE INDEX IF NOT EXISTS idx_chunks_course_id ON public.document_chunks_pgvector(course_id);
CREATE INDEX IF NOT EXISTS idx_chunks_doc_type ON public.document_chunks_pgvector(doc_type);
CREATE INDEX IF NOT EXISTS idx_chunks_page_num ON public.document_chunks_pgvector(page_number);

-- ==============================================================================
-- Helper Function: Semantic Search across Course Memory
-- ==============================================================================
CREATE OR REPLACE FUNCTION match_course_chunks(
    query_embedding vector(768),
    filter_course_id TEXT DEFAULT NULL,
    filter_doc_type TEXT DEFAULT NULL,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    course_id TEXT,
    document_title TEXT,
    doc_type VARCHAR(64),
    page_number INTEGER,
    chunk_text TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        chunks.id,
        chunks.course_id,
        chunks.document_title,
        chunks.doc_type,
        chunks.page_number,
        chunks.chunk_text,
        1 - (chunks.embedding <=> query_embedding) AS similarity
    FROM public.document_chunks_pgvector chunks
    WHERE (filter_course_id IS NULL OR chunks.course_id = filter_course_id)
      AND (filter_doc_type IS NULL OR chunks.doc_type = filter_doc_type)
    ORDER BY chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

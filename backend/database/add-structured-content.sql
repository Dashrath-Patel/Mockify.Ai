-- Add structured_content column to materials table for JSON storage
-- This will store the PaddleOCR structured output

ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS structured_content JSONB DEFAULT '{}';

-- Add index for better JSON query performance
CREATE INDEX IF NOT EXISTS idx_materials_structured_content 
ON public.materials USING gin(structured_content);

-- Add processing method column to track OCR method used
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS processing_method VARCHAR(50) DEFAULT 'tesseract';

-- Show updated table structure (comment out the \d command as it's psql-specific)
-- Use this in psql: \d public.materials;

-- Verify columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'materials' 
AND table_schema = 'public' 
AND column_name IN ('structured_content', 'processing_method');
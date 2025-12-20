-- Add structured_content column for storing PaddleOCR JSON output
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS structured_content JSONB DEFAULT '{}';

-- Add processing_method column to track OCR method used  
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS processing_method VARCHAR(50) DEFAULT 'tesseract';

-- Add index for JSON queries (improves performance)
CREATE INDEX IF NOT EXISTS idx_materials_structured_content 
ON public.materials USING gin(structured_content);
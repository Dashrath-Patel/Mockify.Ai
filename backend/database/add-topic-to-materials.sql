-- Add topic column to materials table
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS topic TEXT;

-- Add index for topic filtering
CREATE INDEX IF NOT EXISTS idx_materials_topic 
ON public.materials(topic);

-- Update existing materials to have a default topic
UPDATE public.materials 
SET topic = 'General'
WHERE topic IS NULL;

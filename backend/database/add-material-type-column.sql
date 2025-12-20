-- Add material_type column to study_materials table for categorization
-- This allows distinguishing between Study Notes, Syllabus, Previous Year Papers, etc.

-- Step 1: Add the material_type column
ALTER TABLE public.study_materials 
ADD COLUMN IF NOT EXISTS material_type TEXT DEFAULT 'notes' 
CHECK (material_type IN ('notes', 'syllabus', 'previous_year_paper', 'textbook', 'reference', 'other'));

-- Step 2: Create an index for faster filtering by material type
CREATE INDEX IF NOT EXISTS idx_study_materials_material_type 
ON public.study_materials(material_type);

-- Step 3: Add helpful comments
COMMENT ON COLUMN public.study_materials.material_type IS 
'Type of study material: notes, syllabus, previous_year_paper, textbook, reference, or other. Used for better organization and specialized processing (e.g., topic extraction from syllabus PDFs)';

-- Step 4: Update structured_content to better store syllabus data
-- Add example of what syllabus structured_content will look like:
-- {
--   "is_syllabus": true,
--   "topics": ["Physics - Mechanics", "Physics - Thermodynamics", "Chemistry - Organic"],
--   "subtopics": {
--     "Physics - Mechanics": ["Newton's Laws", "Kinematics", "Work Energy"],
--     "Chemistry - Organic": ["Hydrocarbons", "Alcohols", "Aldehydes"]
--   },
--   "exam_sections": ["Section A - Physics", "Section B - Chemistry"],
--   "extracted_at": "2025-12-15T10:30:00Z"
-- }

-- Step 5: Verify the change
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'study_materials' 
        AND column_name = 'material_type'
    ) THEN
        RAISE NOTICE '✓ material_type column added successfully to study_materials table';
        RAISE NOTICE '✓ Default value: notes';
        RAISE NOTICE '✓ Allowed values: notes, syllabus, previous_year_paper, textbook, reference, other';
    ELSE
        RAISE WARNING '✗ Failed to add material_type column';
    END IF;
END $$;

-- Clean existing materials that might have null bytes or problematic characters
UPDATE public.materials 
SET extracted_text = regexp_replace(
  regexp_replace(
    regexp_replace(extracted_text, E'\\u0000', '', 'g'),  -- Remove null bytes
    E'[\\u0001-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F]', '', 'g'  -- Remove control chars
  ),
  E'\\s+', ' ', 'g'  -- Normalize whitespace
)
WHERE extracted_text IS NOT NULL 
  AND (
    extracted_text ~ E'\\u0000' 
    OR extracted_text ~ E'[\\u0001-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F]'
  );

-- Set empty strings to null
UPDATE public.materials 
SET extracted_text = NULL 
WHERE extracted_text IS NOT NULL 
  AND trim(extracted_text) = '';

-- Check for any remaining problematic characters
SELECT 
  id, 
  filename,
  length(extracted_text) as text_length,
  CASE 
    WHEN extracted_text ~ E'\\u0000' THEN 'Contains null bytes'
    WHEN extracted_text ~ E'[\\u0001-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F]' THEN 'Contains control chars'
    ELSE 'Clean'
  END as status
FROM public.materials 
WHERE extracted_text IS NOT NULL
LIMIT 10;
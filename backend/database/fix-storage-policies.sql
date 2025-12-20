-- First, drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create new, more permissive storage policies for study-materials bucket
CREATE POLICY "Allow authenticated users to view own files" ON storage.objects
FOR SELECT USING (
  auth.role() = 'authenticated' 
  AND bucket_id = 'study-materials' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' 
  AND bucket_id = 'study-materials' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow authenticated users to update own files" ON storage.objects
FOR UPDATE USING (
  auth.role() = 'authenticated' 
  AND bucket_id = 'study-materials' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow authenticated users to delete own files" ON storage.objects
FOR DELETE USING (
  auth.role() = 'authenticated' 
  AND bucket_id = 'study-materials' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Also ensure the bucket exists and has correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'study-materials', 
  'study-materials', 
  false, 
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png', 'text/plain']
) 
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png', 'text/plain'];

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
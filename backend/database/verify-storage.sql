-- Check if storage bucket exists and create if needed
DO $$
BEGIN
    -- Check if bucket exists
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'study-materials') THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('study-materials', 'study-materials', false);
        
        -- Create storage policies for the bucket
        CREATE POLICY "Users can view own files" ON storage.objects 
        FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
        
        CREATE POLICY "Users can upload files" ON storage.objects 
        FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
        
        CREATE POLICY "Users can update own files" ON storage.objects 
        FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);
        
        CREATE POLICY "Users can delete own files" ON storage.objects 
        FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
        
        RAISE NOTICE 'Created study-materials bucket with policies';
    ELSE
        RAISE NOTICE 'Bucket study-materials already exists';
    END IF;
END $$;

-- Verify bucket exists
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'study-materials';
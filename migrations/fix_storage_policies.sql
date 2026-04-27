-- Fix storage policies for resume-files bucket
-- Run this if you're getting 404 errors on Render

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own resume files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own resume files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own resume files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own resume files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view resume files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to resume-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from resume-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to resume-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from resume-files" ON storage.objects;

-- Create simple public policies for resume-files bucket
CREATE POLICY "Allow public uploads to resume-files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resume-files');

CREATE POLICY "Allow public reads from resume-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resume-files');

CREATE POLICY "Allow public updates to resume-files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'resume-files');

CREATE POLICY "Allow public deletes from resume-files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'resume-files');


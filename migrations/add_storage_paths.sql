-- Add storage path columns to resumes table
ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT,
ADD COLUMN IF NOT EXISTS tex_storage_path TEXT;

-- Create storage bucket for resume files
INSERT INTO storage.buckets (id, name, public)
VALUES ('resume-files', 'resume-files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (in case you ran the old migration)
DROP POLICY IF EXISTS "Users can upload their own resume files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own resume files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own resume files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own resume files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view resume files" ON storage.objects;

-- Create simple public policies for resume-files bucket
-- These allow anyone to upload, view, update, and delete files in the resume-files bucket
-- This is appropriate for a demo app without authentication

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


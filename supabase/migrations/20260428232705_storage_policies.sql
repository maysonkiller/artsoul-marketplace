-- Create artworks bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('artworks', 'artworks', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access for artworks" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to artworks" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in artworks" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in artworks" ON storage.objects;

-- Policy: Anyone can read files from artworks bucket
CREATE POLICY "Public Access for artworks"
ON storage.objects FOR SELECT
USING (bucket_id = 'artworks');

-- Policy: Authenticated users can upload files to artworks bucket
CREATE POLICY "Authenticated users can upload to artworks"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'artworks'
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files in artworks"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'artworks'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'artworks'
  AND auth.role() = 'authenticated'
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files in artworks"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'artworks'
  AND auth.role() = 'authenticated'
);

-- Create public assets bucket for logos and public images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public assets are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload assets" ON storage.objects;

-- Allow public read access to assets bucket
CREATE POLICY "Public assets are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'assets');

-- Allow authenticated users to upload to assets bucket
CREATE POLICY "Authenticated users can upload assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assets');
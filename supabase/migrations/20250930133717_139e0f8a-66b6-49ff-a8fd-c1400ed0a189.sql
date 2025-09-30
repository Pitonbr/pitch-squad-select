-- Add logo_url column to teams table
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create team-logos storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Team admins can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view team logos" ON storage.objects;
DROP POLICY IF EXISTS "Team admins can update their logos" ON storage.objects;
DROP POLICY IF EXISTS "Team admins can delete their logos" ON storage.objects;

-- Create RLS policies for team-logos bucket
CREATE POLICY "Team admins can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-logos' AND
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.admin_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Anyone can view team logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'team-logos');

CREATE POLICY "Team admins can update their logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'team-logos' AND
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.admin_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Team admins can delete their logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-logos' AND
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.admin_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);
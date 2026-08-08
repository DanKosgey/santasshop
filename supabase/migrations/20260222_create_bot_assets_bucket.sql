-- Migration to create bot-assets storage bucket
-- Date: 2026-02-22

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('bot-assets', 'bot-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS for storage.objects
-- Note: We use bucket_id = 'bot-assets' to restrict policies to this specific bucket

-- Policy: Allow anyone (public) to view bot assets
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'bot-assets');

-- Policy: Allow only admins to upload bot assets
CREATE POLICY "Admin Insert Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'bot-assets' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Allow only admins to update bot assets
CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE
TO authenticated
WITH CHECK (
    bucket_id = 'bot-assets' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Allow only admins to delete bot assets
CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'bot-assets' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

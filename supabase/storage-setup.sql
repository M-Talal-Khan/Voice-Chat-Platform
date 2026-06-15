-- IMPORTANT: Run this entire file in your
-- Supabase SQL Editor before using any
-- file upload features in Thiscord.
-- Go to: Supabase Dashboard > SQL Editor
-- > New Query > Paste this > Run

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read of attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read of avatars" ON storage.objects;

-- Create clean simple policies
CREATE POLICY "public can view all storage"
ON storage.objects FOR SELECT
TO public
USING (true);

CREATE POLICY "authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

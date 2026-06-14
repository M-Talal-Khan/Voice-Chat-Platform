-- ============================================================
-- STEP 1: Add missing columns to attachments table
-- The dm_id column is required for DM image attachments,
-- and other columns were never applied to the live DB.
-- ============================================================

ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS width integer;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS height integer;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS is_image boolean DEFAULT false;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS deletion_notified boolean DEFAULT false;

-- Make message_id nullable so attachments can belong to DMs instead
ALTER TABLE public.attachments ALTER COLUMN message_id DROP NOT NULL;

-- Add dm_id column for direct message attachments
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS dm_id uuid REFERENCES public.direct_messages(id) ON DELETE CASCADE;

-- ============================================================
-- STEP 2: Fix attachment RLS policies to support BOTH channel
-- messages (message_id) and direct messages (dm_id).
-- The original policies only checked message_id, which
-- silently blocked all DM attachment inserts and reads.
-- ============================================================

-- Drop the old restrictive policies
DROP POLICY IF EXISTS "Attachments are viewable by channel members" ON attachments;
DROP POLICY IF EXISTS "Attachments are viewable by authorized users" ON attachments;
DROP POLICY IF EXISTS "Members can create attachments" ON attachments;
DROP POLICY IF EXISTS "Authorized users can create attachments" ON attachments;

-- New SELECT policy: allow if the attachment belongs to a
-- channel message the user can see, OR a DM the user is part of
CREATE POLICY "Attachments are viewable by authorized users"
  ON attachments FOR SELECT
  USING (
    -- Channel message attachments
    (message_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.messages
      JOIN public.channels ON channels.id = messages.channel_id
      WHERE messages.id = attachments.message_id
      AND public.is_server_member(channels.server_id, auth.uid())
    ))
    OR
    -- DM attachments
    (dm_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.direct_messages
      WHERE direct_messages.id = attachments.dm_id
      AND (direct_messages.sender_id = auth.uid() OR direct_messages.receiver_id = auth.uid())
    ))
  );

-- New INSERT policy: allow if user is a member of the channel,
-- OR is a participant in the DM
CREATE POLICY "Authorized users can create attachments"
  ON attachments FOR INSERT
  WITH CHECK (
    -- Channel message attachments
    (message_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.messages
      JOIN public.channels ON channels.id = messages.channel_id
      WHERE messages.id = attachments.message_id
      AND public.is_server_member(channels.server_id, auth.uid())
    ))
    OR
    -- DM attachments
    (dm_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.direct_messages
      WHERE direct_messages.id = attachments.dm_id
      AND (direct_messages.sender_id = auth.uid() OR direct_messages.receiver_id = auth.uid())
    ))
  );

-- ============================================================
-- STEP 3: Storage policies for the 'attachments' bucket
-- ============================================================

DO $$
BEGIN
  CREATE POLICY "Allow authenticated uploads"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'attachments' AND
      auth.role() = 'authenticated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'attachments');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow users to delete own files"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'attachments' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- STEP 4: Storage policies for the 'avatars' bucket
-- ============================================================

DO $$
BEGIN
  CREATE POLICY "Allow authenticated avatar uploads"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars' AND
      auth.role() = 'authenticated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow public avatar read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

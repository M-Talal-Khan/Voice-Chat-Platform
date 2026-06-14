-- Supabase Schema Updates for Explore, Friends, and Attachments

-- 1. Alter existing tables
ALTER TABLE servers ADD COLUMN IF NOT EXISTS category text default 'other';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS is_public boolean default true;

ALTER TABLE attachments ADD COLUMN IF NOT EXISTS width integer;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS height integer;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS is_image boolean default false;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE attachments ALTER COLUMN message_id DROP NOT NULL;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS dm_id uuid references direct_messages(id) on delete cascade;

-- 2. Create new tables
CREATE TABLE IF NOT EXISTS join_requests (
  id uuid primary key default gen_random_uuid(),
  server_id uuid references servers(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now(),
  unique(server_id, user_id)
);

CREATE TABLE IF NOT EXISTS friends (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now(),
  unique(sender_id, receiver_id)
);

-- 3. Enable RLS
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for join_requests
DROP POLICY IF EXISTS "Server owner can read requests" ON join_requests;
CREATE POLICY "Server owner can read requests" ON join_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM servers WHERE servers.id = join_requests.server_id AND servers.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "User can read own requests" ON join_requests;
CREATE POLICY "User can read own requests" ON join_requests FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert requests" ON join_requests;
CREATE POLICY "Authenticated users can insert requests" ON join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Server owner can update request" ON join_requests;
CREATE POLICY "Server owner can update request" ON join_requests FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM servers WHERE servers.id = join_requests.server_id AND servers.owner_id = auth.uid()
  )
);

-- 5. RLS Policies for friends
DROP POLICY IF EXISTS "Users can read their own friend relationships" ON friends;
CREATE POLICY "Users can read their own friend relationships" ON friends FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

DROP POLICY IF EXISTS "Users can insert friend requests" ON friends;
CREATE POLICY "Users can insert friend requests" ON friends FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

DROP POLICY IF EXISTS "Receiver can update friend status" ON friends;
CREATE POLICY "Receiver can update friend status" ON friends FOR UPDATE USING (
  auth.uid() = receiver_id
);

DROP POLICY IF EXISTS "Either user can delete friendship" ON friends;
CREATE POLICY "Either user can delete friendship" ON friends FOR DELETE USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- 6. Enable Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE join_requests;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE friends;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

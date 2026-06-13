-- NexTalk Schema
-- Run this in your Supabase SQL editor

-- 0. Extensions
create extension if not exists "pgcrypto";

-- 1. Tables

create table if not exists profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  avatar_url text,
  status text not null default 'online' check (status in ('online', 'idle', 'dnd', 'offline')),
  created_at timestamptz not null default now()
);

create table if not exists servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon_url text,
  owner_id uuid not null references profiles(id) on delete cascade,
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);

create table if not exists server_members (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references servers(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  unique(server_id, user_id)
);

create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references servers(id) on delete cascade,
  name text not null,
  type text not null default 'text' check (type in ('text', 'voice')),
  topic text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  edited boolean not null default false,
  reply_to_id uuid references messages(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null,
  unique(message_id, user_id, emoji)
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  file_type text not null,
  file_size integer not null
);

create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Indexes

create index if not exists idx_messages_channel_created on messages(channel_id, created_at desc);
create index if not exists idx_messages_reply_to on messages(reply_to_id);
create index if not exists idx_direct_messages_participants on direct_messages(sender_id, receiver_id);
create index if not exists idx_direct_messages_read on direct_messages(receiver_id, read);
create index if not exists idx_server_members_user on server_members(user_id);
create index if not exists idx_server_members_server on server_members(server_id);
create index if not exists idx_channels_server on channels(server_id, position);

-- 3. Row Level Security

alter table profiles enable row level security;
alter table servers enable row level security;
alter table server_members enable row level security;
alter table channels enable row level security;
alter table messages enable row level security;
alter table message_reactions enable row level security;
alter table attachments enable row level security;
alter table direct_messages enable row level security;

-- Profiles: readable by all authenticated, editable only by owner
create policy "Profiles are viewable by all authenticated users"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Servers: readable by members, creatable by authenticated users
create policy "Servers are viewable by members"
  on servers for select
  using (
    exists (select 1 from server_members where server_members.server_id = servers.id and server_members.user_id = auth.uid())
  );

create policy "Authenticated users can create servers"
  on servers for insert
  with check (auth.role() = 'authenticated');

create policy "Owner can update server"
  on servers for update
  using (owner_id = auth.uid());

create policy "Owner can delete server"
  on servers for delete
  using (owner_id = auth.uid());

-- Server Members: readable by members of same server
create policy "Members are viewable by other members"
  on server_members for select
  using (
    exists (select 1 from server_members as sm where sm.server_id = server_members.server_id and sm.user_id = auth.uid())
  );

create policy "Members can join servers"
  on server_members for insert
  with check (auth.uid() = user_id);

create policy "Members can leave"
  on server_members for delete
  using (auth.uid() = user_id or auth.uid() in (
    select owner_id from servers where servers.id = server_members.server_id
  ));

create policy "Admin can update member role"
  on server_members for update
  using (
    exists (
      select 1 from server_members as sm
      where sm.server_id = server_members.server_id
      and sm.user_id = auth.uid()
      and sm.role in ('owner', 'admin')
    )
  );

-- Channels: readable by members of parent server
create policy "Channels are viewable by server members"
  on channels for select
  using (
    exists (select 1 from server_members where server_members.server_id = channels.server_id and server_members.user_id = auth.uid())
  );

create policy "Members can create channels"
  on channels for insert
  with check (
    exists (select 1 from server_members where server_members.server_id = channels.server_id and server_members.user_id = auth.uid())
  );

create policy "Admin can update channel"
  on channels for update
  using (
    exists (
      select 1 from server_members
      where server_members.server_id = channels.server_id
      and server_members.user_id = auth.uid()
      and server_members.role in ('owner', 'admin')
    )
  );

create policy "Admin can delete channel"
  on channels for delete
  using (
    exists (
      select 1 from server_members
      where server_members.server_id = channels.server_id
      and server_members.user_id = auth.uid()
      and server_members.role in ('owner', 'admin')
    )
  );

-- Messages: readable by channel members
create policy "Messages are viewable by channel members"
  on messages for select
  using (
    exists (select 1 from channels join server_members on server_members.server_id = channels.server_id where channels.id = messages.channel_id and server_members.user_id = auth.uid())
  );

create policy "Members can insert messages"
  on messages for insert
  with check (
    auth.uid() = user_id and
    exists (select 1 from channels join server_members on server_members.server_id = channels.server_id where channels.id = messages.channel_id and server_members.user_id = auth.uid())
  );

create policy "Owner can update own message"
  on messages for update
  using (
    auth.uid() = user_id or
    exists (
      select 1 from channels join server_members on server_members.server_id = channels.server_id
      where channels.id = messages.channel_id and server_members.user_id = auth.uid()
      and server_members.role in ('owner', 'admin')
    )
  );

create policy "Owner can delete own message"
  on messages for delete
  using (
    auth.uid() = user_id or
    exists (
      select 1 from channels join server_members on server_members.server_id = channels.server_id
      where channels.id = messages.channel_id and server_members.user_id = auth.uid()
      and server_members.role in ('owner', 'admin')
    )
  );

-- Message Reactions
create policy "Reactions are viewable by all authenticated"
  on message_reactions for select
  using (auth.role() = 'authenticated');

create policy "Users can add reactions"
  on message_reactions for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own reactions"
  on message_reactions for delete
  using (auth.uid() = user_id);

-- Attachments: readable by channel members
create policy "Attachments are viewable by channel members"
  on attachments for select
  using (
    exists (
      select 1 from messages
      join channels on channels.id = messages.channel_id
      join server_members on server_members.server_id = channels.server_id
      where messages.id = attachments.message_id
      and server_members.user_id = auth.uid()
    )
  );

create policy "Members can create attachments"
  on attachments for insert
  with check (
    exists (
      select 1 from messages
      join channels on channels.id = messages.channel_id
      join server_members on server_members.server_id = channels.server_id
      where messages.id = attachments.message_id
      and server_members.user_id = auth.uid()
    )
  );

-- Direct Messages
create policy "Users can view their own DMs"
  on direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send DMs"
  on direct_messages for insert
  with check (auth.uid() = sender_id);

create policy "Users can mark DMs as read"
  on direct_messages for update
  using (auth.uid() = receiver_id);

-- 4. Realtime

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table direct_messages;
alter publication supabase_realtime add table message_reactions;
alter publication supabase_realtime add table server_members;

-- 5. Storage buckets (run in Supabase dashboard Storage section)

-- Bucket: avatars (public read, authenticated write)
-- Bucket: attachments (public read, authenticated write)

-- 6. Helper: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

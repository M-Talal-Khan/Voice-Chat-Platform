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

-- 3. Helper functions to avoid RLS recursion

create or replace function public.is_server_member(server_id uuid, user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.server_members
    where server_members.server_id = is_server_member.server_id
    and server_members.user_id = is_server_member.user_id
  );
$$;

create or replace function public.is_server_admin(server_id uuid, user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.server_members
    where server_members.server_id = is_server_admin.server_id
    and server_members.user_id = is_server_admin.user_id
    and server_members.role in ('owner', 'admin')
  );
$$;

-- 4. Row Level Security
-- NOTE: All policies use DROP IF EXISTS so the schema is fully re-runnable

-- Enable RLS on all tables
alter table if exists profiles enable row level security;
alter table if exists servers enable row level security;
alter table if exists server_members enable row level security;
alter table if exists channels enable row level security;
alter table if exists messages enable row level security;
alter table if exists message_reactions enable row level security;
alter table if exists attachments enable row level security;
alter table if exists direct_messages enable row level security;

-- Profiles
drop policy if exists "Profiles are viewable by all authenticated users" on profiles;
create policy "Profiles are viewable by all authenticated users"
  on profiles for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Servers
drop policy if exists "Servers are viewable by members" on servers;
create policy "Servers are viewable by members"
  on servers for select
  using (
    owner_id = auth.uid()
    or
    public.is_server_member(servers.id, auth.uid())
  );

drop policy if exists "Authenticated users can create servers" on servers;
create policy "Authenticated users can create servers"
  on servers for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Owner can update server" on servers;
create policy "Owner can update server"
  on servers for update
  using (owner_id = auth.uid());

drop policy if exists "Owner can delete server" on servers;
create policy "Owner can delete server"
  on servers for delete
  using (owner_id = auth.uid());

-- Server Members
drop policy if exists "Members are viewable by other members" on server_members;
create policy "Members are viewable by other members"
  on server_members for select
  using (public.is_server_member(server_members.server_id, auth.uid()));

drop policy if exists "Members can join servers" on server_members;
create policy "Members can join servers"
  on server_members for insert
  with check (auth.uid() = user_id);

drop policy if exists "Members can leave" on server_members;
create policy "Members can leave"
  on server_members for delete
  using (
    auth.uid() = user_id
    or auth.uid() = (select owner_id from public.servers where servers.id = server_members.server_id)
  );

drop policy if exists "Admin can update member role" on server_members;
create policy "Admin can update member role"
  on server_members for update
  using (public.is_server_admin(server_members.server_id, auth.uid()));

-- Channels
drop policy if exists "Channels are viewable by server members" on channels;
create policy "Channels are viewable by server members"
  on channels for select
  using (public.is_server_member(channels.server_id, auth.uid()));

drop policy if exists "Members can create channels" on channels;
create policy "Members can create channels"
  on channels for insert
  with check (public.is_server_member(channels.server_id, auth.uid()));

drop policy if exists "Admin can update channel" on channels;
create policy "Admin can update channel"
  on channels for update
  using (public.is_server_admin(channels.server_id, auth.uid()));

drop policy if exists "Admin can delete channel" on channels;
create policy "Admin can delete channel"
  on channels for delete
  using (public.is_server_admin(channels.server_id, auth.uid()));

-- Messages
drop policy if exists "Messages are viewable by channel members" on messages;
create policy "Messages are viewable by channel members"
  on messages for select
  using (
    exists (
      select 1 from public.channels
      where channels.id = messages.channel_id
      and public.is_server_member(channels.server_id, auth.uid())
    )
  );

drop policy if exists "Members can insert messages" on messages;
create policy "Members can insert messages"
  on messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.channels
      where channels.id = messages.channel_id
      and public.is_server_member(channels.server_id, auth.uid())
    )
  );

drop policy if exists "Owner can update own message" on messages;
create policy "Owner can update own message"
  on messages for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.channels
      where channels.id = messages.channel_id
      and public.is_server_admin(channels.server_id, auth.uid())
    )
  );

drop policy if exists "Owner can delete own message" on messages;
create policy "Owner can delete own message"
  on messages for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.channels
      where channels.id = messages.channel_id
      and public.is_server_admin(channels.server_id, auth.uid())
    )
  );

-- Message Reactions
drop policy if exists "Reactions are viewable by all authenticated" on message_reactions;
create policy "Reactions are viewable by all authenticated"
  on message_reactions for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can add reactions" on message_reactions;
create policy "Users can add reactions"
  on message_reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove own reactions" on message_reactions;
create policy "Users can remove own reactions"
  on message_reactions for delete
  using (auth.uid() = user_id);

-- Attachments
drop policy if exists "Attachments are viewable by channel members" on attachments;
create policy "Attachments are viewable by channel members"
  on attachments for select
  using (
    exists (
      select 1 from public.messages
      join public.channels on channels.id = messages.channel_id
      where messages.id = attachments.message_id
      and public.is_server_member(channels.server_id, auth.uid())
    )
  );

drop policy if exists "Members can create attachments" on attachments;
create policy "Members can create attachments"
  on attachments for insert
  with check (
    exists (
      select 1 from public.messages
      join public.channels on channels.id = messages.channel_id
      where messages.id = attachments.message_id
      and public.is_server_member(channels.server_id, auth.uid())
    )
  );

-- Direct Messages
drop policy if exists "Users can view their own DMs" on direct_messages;
create policy "Users can view their own DMs"
  on direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can send DMs" on direct_messages;
create policy "Users can send DMs"
  on direct_messages for insert
  with check (auth.uid() = sender_id);

drop policy if exists "Users can mark DMs as read" on direct_messages;
create policy "Users can mark DMs as read"
  on direct_messages for update
  using (auth.uid() = receiver_id);

-- 5. Realtime (idempotent — errors if already added are ignored)

do $$
begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table direct_messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table message_reactions;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table server_members;
exception when duplicate_object then null;
end $$;

-- 6. Storage buckets (run in Supabase dashboard Storage section)

-- Bucket: avatars (public read, authenticated write)
-- Bucket: attachments (public read, authenticated write)

-- 7. Helper: auto-create profile on signup
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

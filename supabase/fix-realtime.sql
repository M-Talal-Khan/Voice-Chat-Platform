-- Run this in your Supabase SQL Editor to enable Realtime for Thiscord

-- 1. Enable Realtime for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 2. Enable Realtime for the direct_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- 3. Enable Realtime for the message_reactions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- Optional: If you haven't already enabled presence
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

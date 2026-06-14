-- Create friends table
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for friends
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friends" ON public.friends FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert friends" ON public.friends FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their friends" ON public.friends FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can delete their friends" ON public.friends FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create join_requests table
CREATE TABLE IF NOT EXISTS public.join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for join_requests
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view join requests" ON public.join_requests FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT owner_id FROM public.servers WHERE id = server_id));
CREATE POLICY "Users can insert join requests" ON public.join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update join requests" ON public.join_requests FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IN (SELECT owner_id FROM public.servers WHERE id = server_id));
CREATE POLICY "Users can delete join requests" ON public.join_requests FOR DELETE USING (auth.uid() = user_id OR auth.uid() IN (SELECT owner_id FROM public.servers WHERE id = server_id));

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.join_requests;

-- Add missing columns to servers
ALTER TABLE public.servers ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.servers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.servers ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Add missing columns to attachments
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS is_image BOOLEAN DEFAULT false;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS deletion_notified BOOLEAN DEFAULT false;

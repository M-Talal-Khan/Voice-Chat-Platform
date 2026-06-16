# Thiscord 
 
A fully featured Discord/TeamSpeak clone built with Next.js 14 App Router, Tailwind CSS, shadcn/ui, Supabase, and LiveKit. 
 
## Features 
- **Realtime Chat:** Optimistic UI, message editing, deletions, emoji reactions, and replies. 
- **Voice Channels:** High-quality voice communication powered by LiveKit with Push To Talk (PTT). 
- **Direct Messages:** Private conversations with friends. 
- **Friends System:** Search users, send friend requests, and manage your friend list. 
- **Server Management:** Create and join servers with unique invite codes. 
- **Explore:** Discover public servers. 
- **File Sharing:** Image upload with automatic Canvas API compression and 7-week auto-delete. 
- **Presence:** Realtime online status and typing indicators. 
- **Polished UI:** Responsive design with smooth animations and Thiscord branding. 
 
## Tech Stack 
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion. 
- **Backend:** Supabase (Auth, Database, Realtime, Storage). 
- **Voice:** LiveKit. 
- **State Management:** Zustand. 
 
## Setup Instructions 
 
1. **Clone the repo:** 
   ```bash 
   git clone <repo-url> 
   cd thiscord 
   ``` 
 
2. **Install dependencies:** 
   ```bash 
   npm install 
   ``` 
 
3. **Configure Environment Variables:** 
   Copy `.env.local.example` to `.env.local` and fill in your Supabase and LiveKit credentials: 
   ```bash 
   cp .env.local.example .env.local 
   ``` 
 
4. **Database & Storage Setup:** 
   Run the following scripts in your Supabase SQL Editor in order: 
   - `supabase/schema.sql` (Complete schema) 
   - `supabase/migrations/001_missing_tables.sql` (Friends and Join Requests) 
   - `supabase/storage-setup.sql` (Storage buckets and policies) 

   ### Storage Setup (Required)
   Before using profile pictures or file uploads, you must configure the storage buckets:
   1. Go to [supabase.com](https://supabase.com) and open your project.
   2. Click **SQL Editor** in the left sidebar.
   3. Click **New Query**.
   4. Open `supabase/storage-setup.sql` in this repo.
   5. Copy the entire contents and paste into the SQL Editor.
   6. Click **Run**.
   7. You should see a "Success" message.
 
5. **Run the app:** 
   ```bash 
   npm run dev 
   ``` 
 
## Deployment 
The project is ready to be deployed on Vercel. Ensure all environment variables are configured in the Vercel dashboard. 
 
## Environment Variables 
- `NEXT_PUBLIC_SUPABASE_URL` 
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY` 
- `NEXT_PUBLIC_LIVEKIT_URL` 
- `LIVEKIT_API_KEY` 
- `LIVEKIT_API_SECRET` 

# Thiscord — Voice & Text Chat Platform

Thiscord is a fully functional Discord/TeamSpeak-like voice and text chat web application built with Next.js, Supabase, and LiveKit. Create servers, hop into voice channels, send direct messages, and stay connected with your community.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **UI Library**: shadcn/ui with Base UI
- **State Management**: Zustand
- **Forms**: react-hook-form + zod validation
- **Database & Auth**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Voice**: LiveKit (WebRTC)
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))
- A LiveKit Cloud or self-hosted server ([livekit.io](https://livekit.io))

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repo-url>
cd Voice-Chat-Platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy the example environment file and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (server-only) |
| `LIVEKIT_API_KEY` | LiveKit API key |
| `LIVEKIT_API_SECRET` | LiveKit API secret |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit WebSocket URL (e.g., `wss://your-project.livekit.cloud`) |

### 4. Run the schema in Supabase

1. Go to your Supabase project dashboard → SQL Editor
2. Open and run the `supabase/schema.sql` file
3. This creates all tables, indexes, RLS policies, and triggers

### 5. Set up Supabase Storage

Create two storage buckets in the Supabase dashboard:

- **avatars** — Public read, authenticated write
- **attachments** — Public read, authenticated write

### 6. Enable Realtime

In your Supabase dashboard → Database → Replication, ensure the following tables are added to the `supabase_realtime` publication:

- `messages`
- `direct_messages`
- `message_reactions`
- `server_members`

### 7. Set up LiveKit

1. Create a project at [livekit.cloud](https://livekit.cloud) (or self-host)
2. Generate an API key and secret
3. Add them to your `.env.local` file
4. Note: LiveKit WebSocket URL typically starts with `wss://`

### 8. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Features

### Authentication
- Email/password registration and login
- Automatic profile creation on signup
- Protected routes via middleware

### Servers & Channels
- Create servers with auto-generated #general and General voice channels
- Join servers via invite codes
- Create, rename, and delete channels
- Server settings and member management
- Owner/admin role management

### Real-time Text Chat
- Send, edit, delete messages
- Reply to messages with preview
- Emoji reactions with toggle
- Typing indicators via Realtime presence
- Load more messages on scroll
- Auto-scroll to new messages

### Voice Channels
- LiveKit-powered voice rooms
- Mute/unmute and deafen controls
- Voice connected status indicator
- Participant tracking

### File Uploads
- Upload images and files to Supabase Storage
- Inline image previews
- File cards with name and size
- 10MB max file size limit

### Direct Messages
- DM list with recent conversations
- Real-time DM chat
- Unread count badges
- Online status indicators

### User Settings
- Edit username with availability check
- Upload avatar
- Status selector (Online, Busy, Away, Invisible)
- Compact mode toggle
- Microphone and speaker selection
- Input volume slider
- Microphone test with audio level meter

## Building for Production

```bash
npm run build
npm start
```

## Deploying to Vercel

1. Push your repository to GitHub
2. Import the project in Vercel
3. Add all environment variables from `.env.local` to Vercel's environment settings
4. Deploy

Make sure to set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as they are needed at build time for the middleware.

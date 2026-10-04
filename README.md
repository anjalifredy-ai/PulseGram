# Pulsegram

**Modern social media platform** — Stories, Reels, Posts, Real-time Messaging, Voice & Video Calling (WebRTC).

**Package name:** `com.gram.pulse`  
**Repository:** https://github.com/anjalifredy-ai/PulseGram

> Original product inspired by modern photo/video social platforms. All branding, UI, and code are original.

---

## Tech Stack

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Frontend           | Next.js 15 (App Router) + TypeScript + Tailwind |
| UI Components      | Radix UI + shadcn/ui + Framer Motion            |
| Auth & DB          | Supabase (Auth, PostgreSQL, Realtime, Storage)  |
| Real-time Chat     | Supabase Realtime + WebSockets                  |
| Media Storage      | Supabase Storage + CDN                          |
| Video Processing   | FFmpeg (server-side) / Cloudinary (optional)    |
| WebRTC Signaling   | Supabase Realtime channels / custom Socket.io   |
| Push Notifications | Firebase Cloud Messaging / Web Push             |
| State Management   | Zustand + React Query (TanStack Query)          |
| Forms              | React Hook Form + Zod                           |
| PWA                | next-pwa / Serwist                              |

---

## Features (Production-ready structure)

- Complete authentication (email, username, profile, password reset, sessions)
- Home feed with Stories, Posts, infinite scroll, double-tap like
- Full Stories system (create, view, reactions, privacy, 24h expiry)
- Reels vertical feed + creator
- Create Post / Story / Reel with media upload pipeline
- Search & Explore
- User profiles, follow system, private accounts
- Likes, comments, replies, mentions
- Direct messaging + Group chats (real-time)
- Voice & Video calling via WebRTC
- Notifications center + push architecture
- Saved posts & collections
- Privacy, blocking, reporting, moderation
- Admin dashboard (protected)
- Dark / Light mode
- Responsive (mobile-first → desktop)
- PWA installable
- Offline-aware UX

---

## Project Structure

```
PulseGram/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App Router pages
│       ├── components/         # UI components
│       ├── lib/                # Utilities, Supabase client, WebRTC
│       ├── hooks/              # Custom hooks
│       ├── stores/             # Zustand stores
│       ├── types/              # TypeScript types
│       └── public/             # Static assets, icons, manifest
├── packages/
│   └── shared/                 # Shared types & utilities
├── supabase/
│   ├── migrations/             # SQL schema migrations
│   ├── functions/              # Edge functions
│   └── seed.sql
├── docs/                       # Architecture docs
├── .env.example
├── package.json
└── README.md
```

---

## Getting Started

### 1. Prerequisites

- Node.js 20+
- Supabase account (free tier works for development)
- (Optional) Cloudinary / FFmpeg for advanced media processing
- (Optional) TURN server for production WebRTC (e.g. Twilio, Metered)

### 2. Clone & Install

```bash
git clone https://github.com/anjalifredy-ai/PulseGram.git
cd PulseGram
npm install
```

### 3. Environment Variables

Copy `.env.example` → `.env.local` and fill in values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
# WebRTC
NEXT_PUBLIC_STUN_SERVERS=stun:stun.l.google.com:19302
# Optional TURN
TURN_URL=
TURN_USERNAME=
TURN_CREDENTIAL=
```

### 4. Database Setup

```bash
# Link your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
npx supabase db push
```

### 5. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Architecture Highlights

### Authentication
- Supabase Auth (email/password + optional OAuth)
- Username uniqueness enforced at DB level
- Session persistence + refresh
- Secure RLS policies on every table

### Media Pipeline
1. Client selects media
2. Client-side compression (browser-image-compression / ffmpeg.wasm where possible)
3. Upload to Supabase Storage with progress
4. Server generates thumbnails / variants (Edge Function)
5. Signed URLs for private content

### Real-time
- Supabase Realtime for chat, presence, notifications, call signaling
- Optimistic UI for likes/follows

### WebRTC Calling
- Peer-to-peer with STUN + optional TURN
- Signaling over Supabase Realtime channels
- One-to-one voice & video first (group-ready architecture)

### Security
- Row Level Security (RLS) on all tables
- Server-side permission checks
- Rate limiting via Edge Functions / middleware
- File type & size validation
- No secrets in client bundle

---

## Current Status

Scaffolding complete. Core modules being implemented iteratively:

- [x] Repository & README
- [x] Database schema design
- [ ] Next.js app bootstrap
- [ ] Auth flows
- [ ] Feed + Stories
- [ ] Messaging + WebRTC
- [ ] Admin + Settings

---

## License

Private / proprietary for now. All rights reserved.

---

Built with ❤️ for the next generation of social.

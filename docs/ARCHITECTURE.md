# Pulsegram Architecture

## Overview

Pulsegram is a full-stack social platform built as a monorepo-ready codebase.

**Primary stack (chosen because Firebase is already provisioned for `com.gram.pulse`):**

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Framer Motion
- **Auth**: Firebase Authentication (Email/Password + Google)
- **Database**: Cloud Firestore (primary) + Realtime Database (presence, call signaling)
- **Storage**: Firebase Storage
- **Realtime**: Firestore listeners + RTDB presence + WebSockets for chat/calls
- **Push**: Firebase Cloud Messaging
- **WebRTC**: Browser WebRTC + RTDB / Firestore signaling channels
- **Mobile readiness**: Same package name `com.gram.pulse`, google-services.json ready for Android / Flutter / React Native later

## High-level modules

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
│  Web (Next.js PWA)  │  Android (com.gram.pulse)  │  iOS     │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
               ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     Firebase Backend                        │
│  Auth │ Firestore │ Storage │ RTDB │ FCM │ Cloud Functions  │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│              Optional external services                     │
│  TURN server │ Cloudinary / FFmpeg │ Analytics              │
└─────────────────────────────────────────────────────────────┘
```

## Data model (Firestore collections)

- `users/{uid}` – profile, settings, privacy, counts
- `usernames/{username}` – unique username → uid mapping
- `posts/{postId}` – feed posts + media refs
- `postMedia/{mediaId}` – individual media items
- `stories/{storyId}` – 24h stories
- `reels/{reelId}` – short videos
- `follows/{followerId_followingId}` – relationship edges
- `followRequests/{id}` – private account requests
- `likes/{postId_uid}` – likes
- `comments/{commentId}` – comments + replies
- `notifications/{notifId}` – activity feed
- `conversations/{convId}` – DMs & groups
- `messages/{convId}/items/{msgId}` – chat messages
- `calls/{callId}` – call records + signaling metadata
- `saved/{uid}/items/{itemId}` – saved content + collections
- `reports/{reportId}` – moderation queue
- `blocks/{blockerId_blockedId}`
- `hashtags/{tag}` – tag → post refs

## Security rules principles

- Every write is authenticated.
- Users can only mutate their own profile / content.
- Follow / block / like operations are dual-checked.
- Private accounts hide content unless approved follower.
- Admin routes protected by custom claims (`admin: true`).
- Storage paths are namespaced by uid and validated by content-type + size.

## WebRTC signaling flow

1. Caller creates `calls/{callId}` document with status `ringing`.
2. Callee receives via FCM + realtime listener.
3. Offer / answer / ICE candidates exchanged on `calls/{callId}/signaling`.
4. On connect → status `connected`, duration tracked.
5. On end → status `ended`, history written.

STUN is free (Google). Production TURN is strongly recommended.

## Media pipeline

1. Client compresses (browser-image-compression / MediaRecorder constraints).
2. Upload to `users/{uid}/posts|stories|reels|chat/...` with progress.
3. Cloud Function generates thumbnail + optional variants.
4. Firestore document updated with download URLs + metadata.
5. CDN delivery via Firebase Storage.

## Package identity

- Android / future native: `com.gram.pulse`
- Firebase project: `viewtube-v2`
- google-services.json already contains the entry for `com.gram.pulse`.

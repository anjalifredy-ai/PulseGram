"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
  Music2,
} from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { Reel } from "@/types";
import { cn, formatCount } from "@/lib/utils";

export default function ReelsPage() {
  const { user } = useAuthStore();
  const [reels, setReels] = useState<Reel[]>([]);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    async function load() {
      const q = query(
        collection(db, "reels"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const snap = await getDocs(q);
      setReels(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reel)));
    }
    load();
  }, []);

  // Play only current video
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === index) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [index, reels]);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    setIndex(i);
  }, []);

  const toggleLike = async (reel: Reel) => {
    if (!user) return;
    const next = !liked[reel.id];
    setLiked((p) => ({ ...p, [reel.id]: next }));
    setReels((prev) =>
      prev.map((r) =>
        r.id === reel.id
          ? { ...r, likesCount: (r.likesCount ?? 0) + (next ? 1 : -1) }
          : r
      )
    );
    try {
      const likeRef = doc(db, "likes", `reel_${reel.id}_${user.uid}`);
      if (next) {
        await setDoc(likeRef, {
          reelId: reel.id,
          userId: user.uid,
          createdAt: Date.now(),
        });
        await updateDoc(doc(db, "reels", reel.id), {
          likesCount: increment(1),
        });
      } else {
        await deleteDoc(likeRef);
        await updateDoc(doc(db, "reels", reel.id), {
          likesCount: increment(-1),
        });
      }
    } catch (e) {
      setLiked((p) => ({ ...p, [reel.id]: !next }));
    }
  };

  if (reels.length === 0) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-black text-white gap-3">
        <p className="font-medium">No reels yet</p>
        <Link href="/create/reel" className="text-brand-400 text-sm">
          Create the first reel
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="h-dvh overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
    >
      {reels.map((reel, i) => (
        <div
          key={reel.id}
          className="h-dvh w-full snap-start relative flex items-center justify-center"
        >
          <video
            ref={(el) => {
              videoRefs.current[i] = el;
            }}
            src={reel.videoUrl}
            className="absolute inset-0 h-full w-full object-cover"
            loop
            playsInline
            muted={muted}
            poster={reel.thumbnailUrl}
          />

          {/* Gradient overlays */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

          {/* Right actions */}
          <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
            <button
              onClick={() => toggleLike(reel)}
              className="flex flex-col items-center gap-1"
            >
              <Heart
                className={cn(
                  "h-7 w-7 text-white",
                  liked[reel.id] && "fill-red-500 text-red-500"
                )}
              />
              <span className="text-xs text-white font-medium">
                {formatCount(reel.likesCount ?? 0)}
              </span>
            </button>
            <Link
              href={`/reel/${reel.id}`}
              className="flex flex-col items-center gap-1"
            >
              <MessageCircle className="h-7 w-7 text-white" />
              <span className="text-xs text-white font-medium">
                {formatCount(reel.commentsCount ?? 0)}
              </span>
            </Link>
            <button className="flex flex-col items-center gap-1">
              <Send className="h-7 w-7 text-white" />
            </button>
            <button className="flex flex-col items-center gap-1">
              <Bookmark className="h-7 w-7 text-white" />
            </button>
          </div>

          {/* Bottom info */}
          <div className="absolute left-3 right-16 bottom-20 z-10 text-white space-y-2">
            <Link
              href={`/u/${reel.author?.username}`}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-full overflow-hidden bg-white/20">
                {reel.author?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={reel.author.photoURL}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <span className="font-semibold text-sm">
                @{reel.author?.username}
              </span>
            </Link>
            {reel.caption && (
              <p className="text-sm line-clamp-2">{reel.caption}</p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-white/80">
              <Music2 className="h-3.5 w-3.5" />
              <span>Original audio</span>
            </div>
          </div>

          {/* Mute toggle */}
          <button
            onClick={() => setMuted((m) => !m)}
            className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-black/40 flex items-center justify-center"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <VolumeX className="h-5 w-5 text-white" />
            ) : (
              <Volume2 className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

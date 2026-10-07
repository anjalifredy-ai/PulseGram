"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { X, Heart, Send } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { Story } from "@/types";

const DEFAULT_DURATION = 5; // seconds for images

export default function StoryViewerPage() {
  const params = useParams();
  const router = useRouter();
  const authorId = params.authorId as string;
  const { user } = useAuthStore();

  const [stories, setStories] = useState<Story[]>([]);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reply, setReply] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    async function load() {
      const now = Date.now();
      const q = query(
        collection(db, "stories"),
        where("authorId", "==", authorId),
        where("expiresAt", ">", now),
        orderBy("expiresAt", "asc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Story));
      setStories(list);
    }
    load();
  }, [authorId]);

  const current = stories[index];
  const duration = (current?.duration ?? DEFAULT_DURATION) * 1000;

  const goNext = useCallback(() => {
    if (index < stories.length - 1) {
      setIndex((i) => i + 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      router.back();
    }
  }, [index, stories.length, router]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setProgress(0);
      elapsedRef.current = 0;
    }
  }, [index]);

  // Progress timer
  useEffect(() => {
    if (!current || paused) return;

    startRef.current = Date.now() - elapsedRef.current;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      elapsedRef.current = elapsed;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p >= 100) goNext();
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current, paused, duration, goNext]);

  // Mark viewed
  useEffect(() => {
    if (!current || !user) return;
    const viewId = `${current.id}_${user.uid}`;
    setDoc(doc(db, "storyViews", viewId), {
      storyId: current.id,
      viewerId: user.uid,
      createdAt: Date.now(),
    }).catch(() => {});
    updateDoc(doc(db, "stories", current.id), {
      viewersCount: increment(1),
    }).catch(() => {});
  }, [current?.id, user]);

  const sendReply = async () => {
    if (!user || !current || !reply.trim()) return;
    // Store as notification + optional DM architecture
    await setDoc(doc(collection(db, "notifications")), {
      recipientId: current.authorId,
      actorId: user.uid,
      type: "story_reply",
      targetId: current.id,
      targetType: "story",
      text: reply.trim(),
      isRead: false,
      createdAt: Date.now(),
    });
    setReply("");
  };

  if (stories.length === 0) {
    return (
      <div className="fixed inset-0 z-[90] bg-black flex items-center justify-center text-white">
        <p className="text-sm text-white/60">No active stories</p>
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 p-2"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[90] bg-black text-white select-none"
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
      onPointerLeave={() => setPaused(false)}
    >
      {/* Progress bars */}
      <div className="absolute top-2 inset-x-2 z-20 flex gap-1">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full bg-white transition-none"
              style={{
                width:
                  i < index ? "100%" : i === index ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-5 inset-x-0 z-20 flex items-center gap-3 px-3 pt-2">
        <div className="h-8 w-8 rounded-full overflow-hidden bg-white/20">
          {current?.author?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.author.photoURL}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <span className="text-sm font-semibold flex-1">
          {current?.author?.username ?? "user"}
        </span>
        <button onClick={() => router.back()} aria-label="Close">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Media */}
      <div className="absolute inset-0 flex items-center justify-center">
        {current?.mediaType === "video" ? (
          <video
            src={current.mediaUrl}
            className="max-h-full max-w-full object-contain"
            autoPlay
            playsInline
            muted={false}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current?.mediaUrl}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      {/* Tap zones */}
      <button
        className="absolute left-0 top-16 bottom-24 w-1/3 z-10"
        onClick={(e) => {
          e.stopPropagation();
          goPrev();
        }}
        aria-label="Previous"
      />
      <button
        className="absolute right-0 top-16 bottom-24 w-1/3 z-10"
        onClick={(e) => {
          e.stopPropagation();
          goNext();
        }}
        aria-label="Next"
      />

      {/* Caption */}
      {current?.caption && (
        <p className="absolute bottom-24 inset-x-4 text-sm text-center z-10">
          {current.caption}
        </p>
      )}

      {/* Reply */}
      {user && user.uid !== authorId && (
        <div className="absolute bottom-0 inset-x-0 p-3 flex items-center gap-2 z-20 safe-bottom bg-gradient-to-t from-black/80 to-transparent">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Reply…"
            className="flex-1 rounded-full border border-white/30 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-white/50"
          />
          <button onClick={sendReply} aria-label="Send reply" className="p-2">
            <Send className="h-5 w-5" />
          </button>
          <button
            onClick={async () => {
              if (!user || !current) return;
              await setDoc(doc(collection(db, "notifications")), {
                recipientId: current.authorId,
                actorId: user.uid,
                type: "story_reaction",
                targetId: current.id,
                targetType: "story",
                text: "❤️",
                isRead: false,
                createdAt: Date.now(),
              });
            }}
            aria-label="React"
            className="p-2"
          >
            <Heart className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

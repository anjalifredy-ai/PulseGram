"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc, increment, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { Post } from "@/types";
import { cn, formatCount, timeAgo } from "@/lib/utils";

interface Props {
  post: Post;
}

export function PostCard({ post }: Props) {
  const user = useAuthStore((s) => s.user);
  const [liked, setLiked] = useState(!!post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);
  const [saved, setSaved] = useState(!!post.isSaved);
  const [showHeart, setShowHeart] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);

  const toggleLike = async () => {
    if (!user) return;
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => c + (next ? 1 : -1));

    try {
      const likeRef = doc(db, "likes", `${post.id}_${user.uid}`);
      if (next) {
        await setDoc(likeRef, {
          postId: post.id,
          userId: user.uid,
          createdAt: Date.now(),
        });
        await updateDoc(doc(db, "posts", post.id), {
          likesCount: increment(1),
        });
      } else {
        await deleteDoc(likeRef);
        await updateDoc(doc(db, "posts", post.id), {
          likesCount: increment(-1),
        });
      }
    } catch (e) {
      // rollback
      setLiked(!next);
      setLikesCount((c) => c + (next ? -1 : 1));
      console.error(e);
    }
  };

  const onDoubleTap = () => {
    if (!liked) toggleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const toggleSave = async () => {
    if (!user) return;
    const next = !saved;
    setSaved(next);
    try {
      const ref = doc(db, "saved", user.uid, "items", post.id);
      if (next) {
        await setDoc(ref, {
          postId: post.id,
          type: "post",
          createdAt: Date.now(),
        });
      } else {
        await deleteDoc(ref);
      }
    } catch (e) {
      setSaved(!next);
      console.error(e);
    }
  };

  const media = post.media?.[mediaIndex];

  return (
    <article className="pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <Link
          href={`/u/${post.author?.username ?? post.authorId}`}
          className="flex items-center gap-2.5"
        >
          <div className="h-8 w-8 rounded-full overflow-hidden bg-[hsl(var(--muted))]">
            {post.author?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.author.photoURL}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs font-semibold">
                {post.author?.displayName?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">
              {post.author?.username ?? "user"}
              {post.author?.isVerified && (
                <span className="ml-1 text-brand-500">✓</span>
              )}
            </p>
            {post.location && (
              <p className="text-[11px] text-muted-foreground">{post.location}</p>
            )}
          </div>
        </Link>
        <button aria-label="More" className="p-1">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Media */}
      <div
        className="relative aspect-square bg-black select-none"
        onDoubleClick={onDoubleTap}
      >
        {media?.type === "video" ? (
          <video
            src={media.url}
            poster={media.thumbnailUrl}
            className="h-full w-full object-contain"
            controls={false}
            playsInline
            muted
            loop
          />
        ) : media ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.url}
            alt={media.altText ?? ""}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : null}

        {/* Multi-media dots */}
        {(post.media?.length ?? 0) > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
            {post.media.map((_, i) => (
              <button
                key={i}
                onClick={() => setMediaIndex(i)}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition",
                  i === mediaIndex ? "bg-white" : "bg-white/40"
                )}
              />
            ))}
          </div>
        )}

        {/* Double-tap heart */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="h-24 w-24 text-white fill-white drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 pt-2">
        <div className="flex items-center gap-4">
          <button onClick={toggleLike} aria-label="Like" className="active:scale-90 transition">
            <Heart
              className={cn(
                "h-6 w-6 transition",
                liked && "fill-red-500 text-red-500 animate-like-pop"
              )}
            />
          </button>
          <Link href={`/post/${post.id}`} aria-label="Comment">
            <MessageCircle className="h-6 w-6" />
          </Link>
          <button aria-label="Share">
            <Send className="h-6 w-6" />
          </button>
        </div>
        <button onClick={toggleSave} aria-label="Save">
          <Bookmark
            className={cn("h-6 w-6", saved && "fill-current")}
          />
        </button>
      </div>

      {/* Likes + caption */}
      <div className="px-3 pt-1.5 space-y-1">
        {likesCount > 0 && (
          <p className="text-sm font-semibold">{formatCount(likesCount)} likes</p>
        )}
        {post.caption && (
          <p className="text-sm">
            <Link
              href={`/u/${post.author?.username}`}
              className="font-semibold mr-1.5"
            >
              {post.author?.username}
            </Link>
            {post.caption}
          </p>
        )}
        {post.commentsCount > 0 && (
          <Link
            href={`/post/${post.id}`}
            className="text-sm text-muted-foreground"
          >
            View all {post.commentsCount} comments
          </Link>
        )}
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
          {timeAgo(post.createdAt)}
        </p>
      </div>
    </article>
  );
}

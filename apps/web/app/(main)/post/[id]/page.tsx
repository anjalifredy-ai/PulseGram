"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  increment,
  deleteDoc,
} from "firebase/firestore";
import { ArrowLeft, Heart, Send } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { Post, Comment } from "@/types";
import { timeAgo, formatCount } from "@/lib/utils";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { user, profile } = useAuthStore();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      const snap = await getDoc(doc(db, "posts", postId));
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() } as Post);
      }
      setLoading(false);
    }
    loadPost();
  }, [postId]);

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc"),
      limit(100)
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment))
      );
    });
    return unsub;
  }, [postId]);

  const sendComment = async () => {
    if (!user || !profile || !text.trim() || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, "comments"), {
        postId,
        authorId: user.uid,
        author: {
          uid: user.uid,
          username: profile.username,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
        },
        text: text.trim(),
        parentId: null,
        likesCount: 0,
        repliesCount: 0,
        createdAt: Date.now(),
      });
      await updateDoc(doc(db, "posts", postId), {
        commentsCount: increment(1),
      });
      if (post && post.authorId !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          recipientId: post.authorId,
          actorId: user.uid,
          type: "comment",
          targetId: postId,
          targetType: "post",
          text: text.trim().slice(0, 100),
          isRead: false,
          createdAt: Date.now(),
        });
      }
      setText("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to comment");
    } finally {
      setSending(false);
    }
  };

  const deleteComment = async (c: Comment) => {
    if (!user || c.authorId !== user.uid) return;
    try {
      await deleteDoc(doc(db, "comments", c.id));
      await updateDoc(doc(db, "posts", postId), {
        commentsCount: increment(-1),
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-20 text-center">
        <p>Post not found</p>
        <button onClick={() => router.back()} className="text-brand-600 text-sm mt-2">
          Go back
        </button>
      </div>
    );
  }

  const media = post.media?.[0];

  return (
    <div className="min-h-dvh max-w-lg mx-auto flex flex-col">
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 h-14 border-b bg-[hsl(var(--surface))]/90 backdrop-blur">
        <button onClick={() => router.back()} aria-label="Back">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-semibold">Post</h1>
      </header>

      {/* Author */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Link href={`/u/${post.author?.username}`} className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full overflow-hidden bg-[hsl(var(--muted))]">
            {post.author?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author.photoURL} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <span className="text-sm font-semibold">{post.author?.username}</span>
        </Link>
      </div>

      {/* Media */}
      <div className="aspect-square bg-black">
        {media?.type === "video" ? (
          <video src={media.url} className="h-full w-full object-contain" controls playsInline />
        ) : media ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="px-3 py-2 space-y-1">
        {post.likesCount > 0 && (
          <p className="text-sm font-semibold">{formatCount(post.likesCount)} likes</p>
        )}
        {post.caption && (
          <p className="text-sm">
            <span className="font-semibold mr-1.5">{post.author?.username}</span>
            {post.caption}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground uppercase">{timeAgo(post.createdAt)}</p>
      </div>

      {/* Comments */}
      <div className="flex-1 border-t px-3 py-3 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No comments yet</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Link href={`/u/${c.author?.username}`} className="shrink-0">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-[hsl(var(--muted))]">
                  {c.author?.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.author.photoURL} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-semibold">
                      {c.author?.displayName?.[0]}
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold mr-1.5">{c.author?.username}</span>
                  {c.text}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                  {user?.uid === c.authorId && (
                    <button
                      onClick={() => deleteComment(c)}
                      className="text-[11px] text-muted-foreground"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment input */}
      {user && (
        <div className="border-t p-3 flex items-center gap-2 safe-bottom">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendComment()}
            placeholder="Add a comment…"
            className="flex-1 rounded-full border bg-[hsl(var(--surface))] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={sendComment}
            disabled={!text.trim() || sending}
            className="text-brand-600 font-semibold text-sm disabled:opacity-40"
          >
            Post
          </button>
        </div>
      )}
    </div>
  );
}

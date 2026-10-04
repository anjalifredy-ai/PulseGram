"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Post } from "@/types";
import { PostCard } from "./post-card";

const PAGE_SIZE = 10;

export function FeedList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = useCallback(
    async (reset = false) => {
      if (!reset && !hasMore) return;
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        let q = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE)
        );

        if (!reset && lastDoc) {
          q = query(
            collection(db, "posts"),
            orderBy("createdAt", "desc"),
            startAfter(lastDoc),
            limit(PAGE_SIZE)
          );
        }

        const snap = await getDocs(q);
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Post)
        );

        setPosts((prev) => (reset ? items : [...prev, ...items]));
        setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
        setHasMore(snap.docs.length === PAGE_SIZE);
      } catch (e) {
        console.error("Feed load error", e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [hasMore, lastDoc]
  );

  useEffect(() => {
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[hsl(var(--muted))]" />
              <div className="h-3 w-28 rounded bg-[hsl(var(--muted))]" />
            </div>
            <div className="aspect-square w-full rounded-2xl bg-[hsl(var(--muted))]" />
            <div className="h-3 w-3/4 rounded bg-[hsl(var(--muted))]" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <p className="text-lg font-medium">No posts yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Follow people or create your first post to see content here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasMore && (
        <div className="py-6 flex justify-center">
          <button
            onClick={() => loadPage(false)}
            disabled={loadingMore}
            className="text-sm font-medium text-brand-600 disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

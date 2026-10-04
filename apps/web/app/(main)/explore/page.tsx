"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from "firebase/firestore";
import { Search } from "lucide-react";
import { db } from "@/lib/firebase/client";
import type { Post, UserProfile } from "@/types";

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function loadExplore() {
      const postsQ = query(
        collection(db, "posts"),
        orderBy("likesCount", "desc"),
        limit(30)
      );
      const snap = await getDocs(postsQ);
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)));
    }
    loadExplore();
  }, []);

  const search = useCallback(async (term: string) => {
    if (!term.trim()) {
      setUsers([]);
      return;
    }
    setSearching(true);
    try {
      const normalized = term.toLowerCase().trim();
      // Username prefix search via usernames collection is ideal;
      // fallback: scan users (ok for early stage)
      const usersQ = query(
        collection(db, "users"),
        where("username", ">=", normalized),
        where("username", "<=", normalized + "\uf8ff"),
        limit(15)
      );
      const snap = await getDocs(usersQ);
      setUsers(snap.docs.map((d) => d.data() as UserProfile));
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(q), 300);
    return () => clearTimeout(t);
  }, [q, search]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 px-4 py-3 border-b bg-[hsl(var(--surface))]/90 backdrop-blur">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search users, hashtags…"
            className="w-full rounded-xl border bg-[hsl(var(--muted))]/50 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </header>

      {q.trim() ? (
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Users {searching && "…"}
          </p>
          {users.length === 0 && !searching ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No users found
            </p>
          ) : (
            <ul className="space-y-1">
              {users.map((u) => (
                <li key={u.uid}>
                  <Link
                    href={`/u/${u.username}`}
                    className="flex items-center gap-3 py-2 rounded-xl hover:bg-[hsl(var(--muted))]/40 px-2"
                  >
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-[hsl(var(--muted))]">
                      {u.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.photoURL}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm font-semibold">
                          {u.displayName?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{u.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.displayName}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post) => {
            const thumb = post.media?.[0];
            return (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="aspect-square bg-[hsl(var(--muted))] relative"
              >
                {thumb?.type === "video" ? (
                  <video
                    src={thumb.url}
                    className="h-full w-full object-cover"
                    muted
                  />
                ) : thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

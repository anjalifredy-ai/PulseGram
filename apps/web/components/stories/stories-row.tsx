"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { UserProfile, Story } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  currentUser: UserProfile | null;
}

type StoryGroup = {
  authorId: string;
  author: Pick<UserProfile, "uid" | "username" | "displayName" | "photoURL">;
  stories: Story[];
  hasUnseen: boolean;
};

export function StoriesRow({ currentUser }: Props) {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    async function load() {
      try {
        const now = Date.now();
        const q = query(
          collection(db, "stories"),
          where("expiresAt", ">", now),
          orderBy("expiresAt", "desc"),
          limit(50)
        );
        const snap = await getDocs(q);
        const stories = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Story));

        // Group by author
        const map = new Map<string, StoryGroup>();
        for (const s of stories) {
          if (!map.has(s.authorId)) {
            map.set(s.authorId, {
              authorId: s.authorId,
              author: s.author ?? {
                uid: s.authorId,
                username: "user",
                displayName: "User",
                photoURL: null,
              },
              stories: [],
              hasUnseen: !s.isSeen,
            });
          }
          const g = map.get(s.authorId)!;
          g.stories.push(s);
          if (!s.isSeen) g.hasUnseen = true;
        }

        setGroups(Array.from(map.values()));
      } catch (e) {
        console.error("Stories load error", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentUser]);

  return (
    <div className="border-b px-3 py-3 overflow-x-auto no-scrollbar">
      <div className="flex gap-4">
        {/* Your Story */}
        {currentUser && (
          <Link href="/create/story" className="flex flex-col items-center gap-1 shrink-0">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-[hsl(var(--muted))] overflow-hidden ring-2 ring-offset-2 ring-offset-[hsl(var(--background))] ring-border">
                {currentUser.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.photoURL}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-lg font-semibold text-muted-foreground">
                    {currentUser.displayName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-brand-600 text-white flex items-center justify-center border-2 border-[hsl(var(--background))]">
                <Plus className="h-3 w-3" strokeWidth={3} />
              </span>
            </div>
            <span className="text-xs text-muted-foreground max-w-[72px] truncate">
              Your story
            </span>
          </Link>
        )}

        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0">
              <div className="h-16 w-16 rounded-full bg-[hsl(var(--muted))] animate-pulse" />
              <div className="h-2 w-12 rounded bg-[hsl(var(--muted))] animate-pulse" />
            </div>
          ))}

        {!loading &&
          groups.map((g) => (
            <Link
              key={g.authorId}
              href={`/stories/${g.authorId}`}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div
                className={cn(
                  "h-16 w-16 rounded-full p-[2px]",
                  g.hasUnseen
                    ? "bg-gradient-to-tr from-brand-500 via-pink-500 to-amber-400"
                    : "bg-[hsl(var(--border))]"
                )}
              >
                <div className="h-full w-full rounded-full overflow-hidden bg-[hsl(var(--surface))] ring-2 ring-[hsl(var(--background))]">
                  {g.author.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.author.photoURL}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-lg font-semibold">
                      {g.author.displayName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs max-w-[72px] truncate">
                {g.author.username}
              </span>
            </Link>
          ))}
      </div>
    </div>
  );
}

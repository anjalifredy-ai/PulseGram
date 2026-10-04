"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { ArrowLeft, Bookmark } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { Post } from "@/types";

export default function SavedPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        const q = query(
          collection(db, "saved", user!.uid, "items"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const items: Post[] = [];
        for (const d of snap.docs) {
          const data = d.data();
          if (data.type === "post" || data.postId) {
            const postSnap = await getDoc(doc(db, "posts", data.postId || d.id));
            if (postSnap.exists()) {
              items.push({ id: postSnap.id, ...postSnap.data() } as Post);
            }
          }
        }
        setPosts(items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <div className="min-h-dvh max-w-lg mx-auto">
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 h-14 border-b bg-[hsl(var(--surface))]/90 backdrop-blur">
        <button onClick={() => router.back()} aria-label="Back">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-semibold">Saved</h1>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Bookmark className="h-12 w-12" />
          <p className="text-sm">No saved posts yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post) => {
            const thumb = post.media?.[0];
            return (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="aspect-square bg-[hsl(var(--muted))]"
              >
                {thumb?.type === "video" ? (
                  <video src={thumb.url} className="h-full w-full object-cover" muted />
                ) : thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb.url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

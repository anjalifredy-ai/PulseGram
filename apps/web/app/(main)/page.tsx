"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { StoriesRow } from "@/components/stories/stories-row";
import { FeedList } from "@/components/feed/feed-list";

export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.replace("/login");
    }
  }, [initialized, loading, user, router]);

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="h-8 w-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh">
      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b bg-[hsl(var(--surface))]/90 backdrop-blur-xl md:hidden">
        <h1 className="text-xl font-bold tracking-tight text-brand-600">
          Pulsegram
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/notifications" aria-label="Notifications">
            <Heart className="h-6 w-6" strokeWidth={1.75} />
          </Link>
          <Link href="/messages" aria-label="Messages">
            <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
          </Link>
        </div>
      </header>

      {/* Stories */}
      <StoriesRow currentUser={profile} />

      {/* Feed */}
      <FeedList />
    </div>
  );
}

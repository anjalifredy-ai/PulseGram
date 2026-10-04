"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { subscribeToConversations } from "@/lib/chat/messaging";
import type { Conversation } from "@/types";
import { timeAgo } from "@/lib/utils";

export default function MessagesInboxPage() {
  const router = useRouter();
  const { user, loading, initialized } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (initialized && !loading && !user) router.replace("/login");
  }, [initialized, loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid, setConversations);
    return unsub;
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b bg-[hsl(var(--surface))]/90 backdrop-blur">
        <h1 className="text-xl font-bold">Messages</h1>
        <button aria-label="Search" className="p-1">
          <Search className="h-5 w-5" />
        </button>
      </header>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <p className="font-medium">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start a conversation from a profile.
          </p>
        </div>
      ) : (
        <ul className="divide-y">
          {conversations.map((c) => {
            const other =
              c.type === "direct"
                ? c.members?.find((m) => m.uid !== user.uid)
                : null;
            const title =
              c.type === "group"
                ? c.name ?? "Group"
                : other?.username ?? "Chat";
            const photo = c.type === "group" ? c.photoURL : other?.photoURL;

            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--muted))]/40 transition"
                >
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-[hsl(var(--muted))] shrink-0">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-semibold">
                        {title[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm truncate">{title}</p>
                      {c.lastMessage && (
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {timeAgo(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {c.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {c.lastMessage.text}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

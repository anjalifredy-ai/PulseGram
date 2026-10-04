"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuthStore } from "@/stores/auth-store";
import { acceptFollowRequest, rejectFollowRequest } from "@/lib/social/follow";
import type { AppNotification } from "@/types";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading, initialized } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (initialized && !loading && !user) router.replace("/login");
  }, [initialized, loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification))
      );
    });
    return unsub;
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, "notifications", n.id), { isRead: true });
    });
    await batch.commit();
  };

  const handleAccept = async (n: AppNotification) => {
    if (!user || !n.actorId) return;
    try {
      await acceptFollowRequest(n.actorId, user.uid);
      await updateDoc(doc(db, "notifications", n.id), { isRead: true });
      toast.success("Request accepted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const handleReject = async (n: AppNotification) => {
    if (!user || !n.actorId) return;
    try {
      await rejectFollowRequest(n.actorId, user.uid);
      await updateDoc(doc(db, "notifications", n.id), { isRead: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const label = (n: AppNotification) => {
    switch (n.type) {
      case "like":
        return "liked your post";
      case "comment":
        return "commented on your post";
      case "comment_reply":
        return "replied to your comment";
      case "follow":
        return "started following you";
      case "follow_request":
        return "requested to follow you";
      case "follow_accepted":
        return "accepted your follow request";
      case "mention":
        return "mentioned you";
      case "story_reply":
        return "replied to your story";
      case "story_reaction":
        return "reacted to your story";
      case "message":
        return "sent you a message";
      case "missed_call":
        return "missed your call";
      default:
        return n.text ?? "activity";
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b bg-[hsl(var(--surface))]/90 backdrop-blur">
        <h1 className="text-xl font-bold">Notifications</h1>
        <button
          onClick={markAllRead}
          className="text-sm text-brand-600 font-medium"
        >
          Mark all read
        </button>
      </header>

      {notifications.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground text-sm">
          No notifications yet
        </div>
      ) : (
        <ul className="divide-y">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                !n.isRead ? "bg-brand-50/50 dark:bg-brand-900/10" : ""
              }`}
            >
              <Link
                href={n.actor?.username ? `/u/${n.actor.username}` : "#"}
                className="h-10 w-10 rounded-full overflow-hidden bg-[hsl(var(--muted))] shrink-0"
              >
                {n.actor?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.actor.photoURL}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm font-semibold">
                    {n.actor?.displayName?.[0] ?? "?"}
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">
                    {n.actor?.username ?? "user"}
                  </span>{" "}
                  {label(n)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {timeAgo(n.createdAt)}
                </p>
              </div>

              {n.type === "follow_request" && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleAccept(n)}
                    className="rounded-lg bg-brand-600 text-white text-xs font-semibold px-3 py-1.5"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleReject(n)}
                    className="rounded-lg border text-xs font-semibold px-3 py-1.5"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

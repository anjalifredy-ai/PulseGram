"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { Settings, Grid3X3, Film, UserPlus, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase/client";
import { getUserByUsername } from "@/lib/auth/auth-service";
import {
  followUser,
  unfollowUser,
  getFollowStatus,
} from "@/lib/social/follow";
import { useAuthStore } from "@/stores/auth-store";
import type { UserProfile, Post } from "@/types";
import { formatCount } from "@/lib/utils";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user, profile: me } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followStatus, setFollowStatus] = useState<"none" | "active" | "pending">("none");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwn = me?.username === username;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const p = await getUserByUsername(username);
        if (!p) {
          setProfile(null);
          return;
        }
        setProfile(p);

        if (user && user.uid !== p.uid) {
          const status = await getFollowStatus(user.uid, p.uid);
          setFollowStatus(status);
        }

        const postsQ = query(
          collection(db, "posts"),
          where("authorId", "==", p.uid),
          orderBy("createdAt", "desc"),
          limit(30)
        );
        const snap = await getDocs(postsQ);
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username, user]);

  const handleFollow = async () => {
    if (!user || !profile) return;
    setActionLoading(true);
    try {
      if (followStatus === "none") {
        const status = await followUser(user.uid, profile.uid, profile.isPrivate);
        setFollowStatus(status);
        toast.success(status === "pending" ? "Request sent" : "Following");
      } else {
        await unfollowUser(user.uid, profile.uid);
        setFollowStatus("none");
        toast.success("Unfollowed");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
        <p className="text-lg font-medium">User not found</p>
        <button onClick={() => router.back()} className="text-brand-600 text-sm">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b sticky top-0 bg-[hsl(var(--surface))]/90 backdrop-blur z-10">
        <h1 className="font-semibold text-lg">{profile.username}</h1>
        {isOwn && (
          <Link href="/settings" aria-label="Settings">
            <Settings className="h-6 w-6" />
          </Link>
        )}
      </header>

      {/* Profile info */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full overflow-hidden bg-[hsl(var(--muted))] shrink-0">
            {profile.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-2xl font-semibold text-muted-foreground">
                {profile.displayName?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-around text-center">
            <div>
              <p className="font-semibold">{formatCount(profile.postsCount)}</p>
              <p className="text-xs text-muted-foreground">posts</p>
            </div>
            <Link href={`/u/${username}/followers`}>
              <p className="font-semibold">{formatCount(profile.followersCount)}</p>
              <p className="text-xs text-muted-foreground">followers</p>
            </Link>
            <Link href={`/u/${username}/following`}>
              <p className="font-semibold">{formatCount(profile.followingCount)}</p>
              <p className="text-xs text-muted-foreground">following</p>
            </Link>
          </div>
        </div>

        <div className="mt-3">
          <p className="font-semibold text-sm">{profile.displayName}</p>
          {profile.bio && <p className="text-sm mt-0.5 whitespace-pre-wrap">{profile.bio}</p>}
          {profile.website && (
            <a
              href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-600 font-medium"
            >
              {profile.website}
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {isOwn ? (
            <>
              <Link
                href="/settings/edit-profile"
                className="flex-1 rounded-xl border py-2 text-center text-sm font-semibold"
              >
                Edit profile
              </Link>
              <Link
                href="/settings"
                className="flex-1 rounded-xl border py-2 text-center text-sm font-semibold"
              >
                Settings
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={handleFollow}
                disabled={actionLoading}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                  followStatus === "active" || followStatus === "pending"
                    ? "border"
                    : "bg-brand-600 text-white"
                }`}
              >
                {followStatus === "active"
                  ? "Following"
                  : followStatus === "pending"
                  ? "Requested"
                  : "Follow"}
              </button>
              <Link
                href={`/messages?to=${profile.uid}`}
                className="flex-1 rounded-xl border py-2 text-center text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </Link>
              <Link
                href={`/call/${profile.uid}?type=voice`}
                className="rounded-xl border px-3 py-2 flex items-center justify-center"
                aria-label="Call"
              >
                <Phone className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t flex">
        <button className="flex-1 flex items-center justify-center py-3 border-b-2 border-foreground">
          <Grid3X3 className="h-5 w-5" />
        </button>
        <button className="flex-1 flex items-center justify-center py-3 text-muted-foreground">
          <Film className="h-5 w-5" />
        </button>
      </div>

      {/* Grid */}
      {posts.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          No posts yet
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
                    poster={thumb.thumbnailUrl}
                    className="h-full w-full object-cover"
                    muted
                  />
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

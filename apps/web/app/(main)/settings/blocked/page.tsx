"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getUserProfile } from "@/lib/auth/auth-service";
import { getBlockedUsers, unblockUser } from "@/lib/social/block";
import { useAuthStore } from "@/stores/auth-store";
import type { UserProfile } from "@/types";

export default function BlockedUsersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [blocked, setBlocked] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        const list = await getBlockedUsers(user!.uid);
        const profiles: UserProfile[] = [];
        for (const b of list) {
          const p = await getUserProfile(b.blockedId);
          if (p) profiles.push(p);
        }
        setBlocked(profiles);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleUnblock = async (uid: string) => {
    if (!user) return;
    try {
      await unblockUser(user.uid, uid);
      setBlocked((prev) => prev.filter((p) => p.uid !== uid));
      toast.success("Unblocked");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <div className="min-h-dvh max-w-lg mx-auto">
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 h-14 border-b bg-[hsl(var(--surface))]/90 backdrop-blur">
        <button onClick={() => router.back()} aria-label="Back">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-semibold">Blocked accounts</h1>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
        </div>
      ) : blocked.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-20">
          No blocked accounts
        </p>
      ) : (
        <ul className="divide-y">
          {blocked.map((p) => (
            <li key={p.uid} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/u/${p.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-[hsl(var(--muted))] shrink-0">
                  {p.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoURL} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm font-semibold">
                      {p.displayName?.[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{p.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.displayName}</p>
                </div>
              </Link>
              <button
                onClick={() => handleUnblock(p.uid)}
                className="rounded-lg border text-xs font-semibold px-3 py-1.5 shrink-0"
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

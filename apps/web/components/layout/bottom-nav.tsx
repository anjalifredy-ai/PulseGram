"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, Clapperboard, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Search", icon: Search },
  { href: "/create", label: "Create", icon: PlusSquare },
  { href: "/reels", label: "Reels", icon: Clapperboard },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const profile = useAuthStore((s) => s.profile);

  // Hide on auth screens, full-screen reels, calls, story viewer
  const hide =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/stories/") ||
    pathname.startsWith("/call") ||
    pathname.startsWith("/messages/");

  if (hide) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t bg-[hsl(var(--surface))]/90 backdrop-blur-xl safe-bottom md:hidden">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          // Profile tab links to own profile
          const finalHref =
            href === "/profile" && profile?.username
              ? `/u/${profile.username}`
              : href;

          return (
            <Link
              key={href}
              href={finalHref}
              aria-label={label}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                active ? "text-brand-600" : "text-muted-foreground"
              )}
            >
              <Icon
                className={cn("h-6 w-6", active && "stroke-[2.5]")}
                strokeWidth={active ? 2.5 : 1.75}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  PlusSquare,
  Clapperboard,
  User,
  Heart,
  MessageCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Search", icon: Search },
  { href: "/create", label: "Create", icon: PlusSquare },
  { href: "/reels", label: "Reels", icon: Clapperboard },
  { href: "/notifications", label: "Notifications", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const profile = useAuthStore((s) => s.profile);

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 border-r sticky top-0 h-dvh p-4 shrink-0">
      <Link href="/" className="mb-8 px-3">
        <span className="text-2xl font-bold tracking-tight text-brand-600">
          Pulsegram
        </span>
      </Link>

      <nav className="flex-1 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          const finalHref =
            href === "/profile" && profile?.username
              ? `/u/${profile.username}`
              : href;

          return (
            <Link
              key={href}
              href={finalHref}
              className={cn(
                "flex items-center gap-4 rounded-xl px-3 py-3 text-[15px] transition",
                active
                  ? "font-semibold bg-[hsl(var(--muted))]"
                  : "hover:bg-[hsl(var(--muted))]/70"
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.75} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className="flex items-center gap-4 rounded-xl px-3 py-3 text-[15px] hover:bg-[hsl(var(--muted))]/70"
      >
        <Settings className="h-6 w-6" strokeWidth={1.75} />
        <span>Settings</span>
      </Link>
    </aside>
  );
}

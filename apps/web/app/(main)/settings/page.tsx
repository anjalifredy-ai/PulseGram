"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Bell,
  Shield,
  Eye,
  MessageCircle,
  Phone,
  Palette,
  HelpCircle,
  LogOut,
  ChevronRight,
  Bookmark,
  Ban,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

const sections = [
  {
    title: "Account",
    items: [
      { href: "/settings/edit-profile", label: "Edit profile", icon: User },
      { href: "/settings/password", label: "Password & security", icon: Lock },
      { href: "/saved", label: "Saved", icon: Bookmark },
    ],
  },
  {
    title: "Privacy",
    items: [
      { href: "/settings/privacy", label: "Privacy", icon: Eye },
      { href: "/settings/blocked", label: "Blocked accounts", icon: Ban },
      { href: "/settings/messages", label: "Messages", icon: MessageCircle },
    ],
  },
  {
    title: "Preferences",
    items: [
      { href: "/settings/notifications", label: "Notifications", icon: Bell },
      { href: "/settings/appearance", label: "Appearance", icon: Palette },
      { href: "/settings/calls", label: "Calls", icon: Phone },
    ],
  },
  {
    title: "Support",
    items: [
      { href: "/settings/security", label: "Security", icon: Shield },
      { href: "/help", label: "Help", icon: HelpCircle },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { profile, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    router.replace("/login");
  };

  return (
    <div className="min-h-dvh max-w-lg mx-auto">
      <header className="sticky top-0 z-40 flex items-center px-4 h-14 border-b bg-[hsl(var(--surface))]/90 backdrop-blur">
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      {profile && (
        <div className="px-4 py-4 border-b">
          <p className="font-semibold">{profile.displayName}</p>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
      )}

      {sections.map((section) => (
        <div key={section.title} className="py-2">
          <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {section.title}
          </p>
          <ul>
            {section.items.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--muted))]/40 transition"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 text-sm">{label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="px-4 py-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full rounded-xl border border-red-200 dark:border-red-900 text-red-600 py-3 px-4 text-sm font-medium"
        >
          <LogOut className="h-5 w-5" />
          Log out
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-8">
        Pulsegram · com.gram.pulse · v0.1.0
      </p>
    </div>
  );
}

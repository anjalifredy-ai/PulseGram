"use client";

import Link from "next/link";
import { Image, Film, Circle, Camera } from "lucide-react";

const options = [
  {
    href: "/create/post",
    title: "Post",
    description: "Share photos or videos to your feed",
    icon: Image,
    color: "from-brand-500 to-purple-600",
  },
  {
    href: "/create/story",
    title: "Story",
    description: "Share a moment that disappears in 24h",
    icon: Circle,
    color: "from-pink-500 to-rose-500",
  },
  {
    href: "/create/reel",
    title: "Reel",
    description: "Create a short vertical video",
    icon: Film,
    color: "from-violet-500 to-indigo-600",
  },
];

export default function CreatePage() {
  return (
    <div className="min-h-dvh px-4 py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create</h1>
      <div className="space-y-3">
        {options.map(({ href, title, description, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl border p-4 transition hover:bg-[hsl(var(--muted))]/50 active:scale-[0.98]"
          >
            <div
              className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shrink-0`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

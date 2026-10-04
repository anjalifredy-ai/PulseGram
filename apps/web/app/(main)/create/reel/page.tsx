"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Film, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { collection, addDoc, updateDoc, doc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuthStore } from "@/stores/auth-store";
import { uploadReelVideo, isVideo } from "@/lib/media/upload";

export default function CreateReelPage() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !isVideo(f)) {
      toast.error("Select a video file");
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      toast.error("Video must be under 100MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const publish = async () => {
    if (!user || !profile || !file) return;
    setUploading(true);
    try {
      const result = await uploadReelVideo(user.uid, file, (p) =>
        setProgress(Math.round(p.progress))
      );

      const hashtags =
        caption.match(/#[\w]+/g)?.map((t) => t.slice(1).toLowerCase()) ?? [];
      const mentions =
        caption.match(/@[\w.]+/g)?.map((t) => t.slice(1).toLowerCase()) ?? [];

      await addDoc(collection(db, "reels"), {
        authorId: user.uid,
        author: {
          uid: user.uid,
          username: profile.username,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          isVerified: profile.isVerified ?? false,
        },
        videoUrl: result.url,
        thumbnailUrl: result.url,
        caption: caption.trim(),
        hashtags,
        mentions,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 0,
        originalAudio: true,
        createdAt: Date.now(),
      });

      await updateDoc(doc(db, "users", user.uid), {
        reelsCount: increment(1),
        updatedAt: Date.now(),
      });

      toast.success("Reel published");
      router.replace("/reels");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to publish reel");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-black text-white">
      <header className="flex items-center justify-between px-4 h-14 absolute top-0 inset-x-0 z-10">
        <button onClick={() => router.back()} aria-label="Close">
          <X className="h-6 w-6" />
        </button>
        <span className="font-semibold">New Reel</span>
        <button
          onClick={publish}
          disabled={!file || uploading}
          className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold disabled:opacity-40"
        >
          {uploading ? `${progress}%` : "Share"}
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center relative">
        {!preview ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-3 text-white/70"
          >
            <Film className="h-16 w-16" />
            <span>Select a video</span>
            <span className="text-xs text-white/40">Max 100MB · MP4 / WebM</span>
          </button>
        ) : (
          <video
            src={preview}
            className="max-h-dvh w-full object-contain"
            controls
            autoPlay
            loop
            playsInline
          />
        )}

        {preview && (
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption… #hashtags @mentions"
              rows={2}
              maxLength={2200}
              className="w-full bg-transparent border-b border-white/30 py-2 text-sm outline-none placeholder:text-white/50 resize-none"
            />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-brand-400" />
            <p className="text-sm">{progress}%</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onSelect}
      />
    </div>
  );
}

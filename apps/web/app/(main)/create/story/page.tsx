"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuthStore } from "@/stores/auth-store";
import { uploadStoryMedia, isImage, isVideo } from "@/lib/media/upload";

const STORY_DURATION_MS = 24 * 60 * 60 * 1000;

export default function CreateStoryPage() {
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
    if (!f || (!isImage(f) && !isVideo(f))) {
      toast.error("Select an image or video");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const publish = async () => {
    if (!user || !profile || !file) return;
    setUploading(true);
    try {
      const result = await uploadStoryMedia(user.uid, file, (p) =>
        setProgress(Math.round(p.progress))
      );

      const now = Date.now();
      await addDoc(collection(db, "stories"), {
        authorId: user.uid,
        author: {
          uid: user.uid,
          username: profile.username,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
        },
        mediaUrl: result.url,
        mediaType: isVideo(file) ? "video" : "image",
        duration: isVideo(file) ? 15 : 5,
        caption: caption.trim() || null,
        viewersCount: 0,
        reactionsCount: 0,
        privacy: "followers",
        createdAt: now,
        expiresAt: now + STORY_DURATION_MS,
      });

      toast.success("Story shared");
      router.replace("/");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to share story");
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
            <ImagePlus className="h-16 w-16" />
            <span>Add photo or video</span>
          </button>
        ) : isVideo(file!) ? (
          <video src={preview} className="max-h-dvh w-full object-contain" controls autoPlay muted loop />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="max-h-dvh w-full object-contain" />
        )}

        {preview && (
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption…"
              className="w-full bg-transparent border-b border-white/30 py-2 text-sm outline-none placeholder:text-white/50"
              maxLength={200}
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
        accept="image/*,video/*"
        className="hidden"
        onChange={onSelect}
      />
    </div>
  );
}

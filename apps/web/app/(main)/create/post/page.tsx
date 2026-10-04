"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { collection, addDoc, updateDoc, doc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuthStore } from "@/stores/auth-store";
import { uploadPostMedia, isImage, isVideo, type UploadProgress } from "@/lib/media/upload";
import type { PostMedia } from "@/types";

export default function CreatePostPage() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter(
      (f) => isImage(f) || isVideo(f)
    );
    if (selected.length === 0) {
      toast.error("Select images or videos");
      return;
    }
    if (selected.length > 10) {
      toast.error("Maximum 10 media items");
      return;
    }
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const publish = async () => {
    if (!user || !profile || files.length === 0) return;
    setUploading(true);
    setProgress(0);

    try {
      const results = await uploadPostMedia(user.uid, files, (idx, p) => {
        const overall = ((idx + p.progress / 100) / files.length) * 100;
        setProgress(Math.round(overall));
      });

      const media: PostMedia[] = results.map((r, i) => ({
        id: `${Date.now()}_${i}`,
        type: isVideo(files[i]) ? "video" : "image",
        url: r.url,
        contentType: r.contentType,
      }));

      const hashtags =
        caption.match(/#[\w]+/g)?.map((t) => t.slice(1).toLowerCase()) ?? [];
      const mentions =
        caption.match(/@[\w.]+/g)?.map((t) => t.slice(1).toLowerCase()) ?? [];

      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        author: {
          uid: user.uid,
          username: profile.username,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          isVerified: profile.isVerified ?? false,
        },
        caption: caption.trim(),
        media,
        location: location.trim() || null,
        hashtags,
        mentions,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        savesCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await updateDoc(doc(db, "users", user.uid), {
        postsCount: increment(1),
        updatedAt: Date.now(),
      });

      toast.success("Post published");
      router.replace("/");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to publish");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      <header className="flex items-center justify-between px-4 h-14 border-b sticky top-0 bg-[hsl(var(--surface))]/90 backdrop-blur z-10">
        <button onClick={() => router.back()} aria-label="Close">
          <X className="h-6 w-6" />
        </button>
        <h1 className="font-semibold">New post</h1>
        <button
          onClick={publish}
          disabled={files.length === 0 || uploading}
          className="text-brand-600 font-semibold text-sm disabled:opacity-40"
        >
          {uploading ? `${progress}%` : "Share"}
        </button>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {previews.length === 0 ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-brand-500 hover:text-brand-600 transition"
          >
            <ImagePlus className="h-12 w-12" />
            <span className="text-sm font-medium">Select photos or videos</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-black">
                {isVideo(files[i]) ? (
                  <video src={src} className="h-full w-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="h-full w-full object-cover" />
                )}
                <button
                  onClick={() => removeFile(i)}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {files.length < 10 && (
              <button
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center text-muted-foreground"
              >
                <ImagePlus className="h-8 w-8" />
              </button>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={onSelect}
        />

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption…"
          rows={3}
          maxLength={2200}
          className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />

        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Add location"
          className="w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />

        {uploading && (
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
              <div
                className="h-full bg-brand-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading & publishing… {progress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

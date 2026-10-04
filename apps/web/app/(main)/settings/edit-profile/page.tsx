"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "@/lib/firebase/client";
import { useAuthStore } from "@/stores/auth-store";
import { uploadProfilePhoto } from "@/lib/media/upload";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setBio(profile.bio ?? "");
      setWebsite(profile.website ?? "");
      setPhotoURL(profile.photoURL);
    }
  }, [profile]);

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      const result = await uploadProfilePhoto(user.uid, file);
      setPhotoURL(result.url);
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: result.url,
        updatedAt: Date.now(),
      });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: result.url });
      }
      await refreshProfile();
      toast.success("Photo updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        bio: bio.trim(),
        website: website.trim() || null,
        updatedAt: Date.now(),
      });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
        });
      }
      await refreshProfile();
      toast.success("Profile updated");
      router.back();
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh max-w-lg mx-auto">
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b bg-[hsl(var(--surface))]/90 backdrop-blur">
        <button onClick={() => router.back()} aria-label="Back">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-semibold">Edit profile</h1>
        <button
          onClick={save}
          disabled={saving}
          className="text-brand-600 font-semibold text-sm disabled:opacity-40"
        >
          {saving ? "Saving…" : "Done"}
        </button>
      </header>

      <div className="flex flex-col items-center py-6 gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative h-24 w-24 rounded-full overflow-hidden bg-[hsl(var(--muted))]"
          disabled={uploadingPhoto}
        >
          {photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoURL} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-2xl font-semibold text-muted-foreground">
              {displayName?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <span className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </span>
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-sm font-medium text-brand-600"
          disabled={uploadingPhoto}
        >
          {uploadingPhoto ? "Uploading…" : "Change photo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPhotoChange}
        />
      </div>

      <div className="px-4 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            className="w-full mt-1 rounded-xl border bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Username</label>
          <input
            value={profile?.username ?? ""}
            disabled
            className="w-full mt-1 rounded-xl border bg-[hsl(var(--muted))]/50 px-3 py-2.5 text-sm text-muted-foreground"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Username cannot be changed here yet
          </p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={150}
            rows={3}
            className="w-full mt-1 rounded-xl border bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Website</label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className="w-full mt-1 rounded-xl border bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  );
}

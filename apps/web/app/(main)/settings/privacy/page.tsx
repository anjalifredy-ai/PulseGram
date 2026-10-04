"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase/client";
import { useAuthStore } from "@/stores/auth-store";

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuthStore();
  const [isPrivate, setIsPrivate] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setIsPrivate(profile.isPrivate ?? false);
      setActivityStatus(profile.settings?.activityStatus ?? true);
      setReadReceipts(profile.settings?.readReceipts ?? true);
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isPrivate,
        "settings.activityStatus": activityStatus,
        "settings.readReceipts": readReceipts,
        updatedAt: Date.now(),
      });
      await refreshProfile();
      toast.success("Privacy updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({
    label,
    description,
    value,
    onChange,
  }: {
    label: string;
    description: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full px-4 py-4 border-b text-left"
    >
      <div className="pr-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div
        className={`h-6 w-11 rounded-full transition relative shrink-0 ${
          value ? "bg-brand-600" : "bg-[hsl(var(--muted))]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            value ? "left-[22px]" : "left-0.5"
          }`}
        />
      </div>
    </button>
  );

  return (
    <div className="min-h-dvh max-w-lg mx-auto">
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b bg-[hsl(var(--surface))]/90 backdrop-blur">
        <button onClick={() => router.back()} aria-label="Back">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-semibold">Privacy</h1>
        <button
          onClick={save}
          disabled={saving}
          className="text-brand-600 font-semibold text-sm disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </header>

      <Toggle
        label="Private account"
        description="Only approved followers can see your posts and stories"
        value={isPrivate}
        onChange={setIsPrivate}
      />
      <Toggle
        label="Activity status"
        description="Show when you are online"
        value={activityStatus}
        onChange={setActivityStatus}
      />
      <Toggle
        label="Read receipts"
        description="Let others know when you have read their messages"
        value={readReceipts}
        onChange={setReadReceipts}
      />
    </div>
  );
}

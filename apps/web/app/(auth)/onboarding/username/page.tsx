"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  checkUsernameAvailable,
  completeGoogleProfile,
} from "@/lib/auth/auth-service";
import { useAuthStore } from "@/stores/auth-store";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9._]+$/, "Only letters, numbers, dots and underscores"),
  displayName: z.string().min(1).max(50),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingUsernamePage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuthStore();
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: user?.displayName ?? "",
    },
  });

  const usernameValue = watch("username");

  const check = async () => {
    if (!usernameValue || usernameValue.length < 3) return;
    setChecking(true);
    try {
      setAvailable(await checkUsernameAvailable(usernameValue));
    } finally {
      setChecking(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      router.replace("/login");
      return;
    }
    try {
      await completeGoogleProfile(user.uid, values.username, values.displayName);
      await refreshProfile();
      toast.success("Welcome to Pulsegram");
      router.replace("/");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-brand-600">Pulsegram</h1>
          <p className="text-sm text-muted-foreground">
            Pick a username to finish setting up
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register("username")}
              placeholder="Username"
              onBlur={check}
              className="w-full rounded-xl border bg-[hsl(var(--surface))] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
            {checking && (
              <p className="mt-1 text-xs text-muted-foreground">Checking…</p>
            )}
            {available === true && (
              <p className="mt-1 text-xs text-green-600">Available</p>
            )}
            {available === false && (
              <p className="mt-1 text-xs text-red-500">Taken</p>
            )}
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
            )}
          </div>

          <div>
            <input
              {...register("displayName")}
              placeholder="Display name"
              className="w-full rounded-xl border bg-[hsl(var(--surface))] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.displayName && (
              <p className="mt-1 text-xs text-red-500">
                {errors.displayName.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || available === false}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

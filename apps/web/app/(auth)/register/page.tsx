"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  registerWithEmail,
  checkUsernameAvailable,
  loginWithGoogle,
} from "@/lib/auth/auth-service";
import { useAuthStore } from "@/stores/auth-store";

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9._]+$/, "Only letters, numbers, dots and underscores"),
    displayName: z.string().min(1).max(50),
    password: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const usernameValue = watch("username");

  const checkUsername = async () => {
    if (!usernameValue || usernameValue.length < 3) return;
    setCheckingUsername(true);
    try {
      const available = await checkUsernameAvailable(usernameValue);
      setUsernameAvailable(available);
    } finally {
      setCheckingUsername(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await registerWithEmail({
        email: values.email,
        password: values.password,
        username: values.username,
        displayName: values.displayName,
      });
      await refreshProfile();
      toast.success("Account created");
      router.replace("/");
    } catch (err: any) {
      toast.error(err?.message ?? "Registration failed");
    }
  };

  const handleGoogle = async () => {
    try {
      const profile = await loginWithGoogle();
      if (!profile.username) {
        router.replace("/onboarding/username");
      } else {
        await refreshProfile();
        router.replace("/");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-10 bg-[hsl(var(--background))]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-brand-600">
            Pulsegram
          </h1>
          <p className="text-muted-foreground text-sm">
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <input
              {...register("email")}
              type="email"
              placeholder="Email"
              className="w-full rounded-xl border bg-[hsl(var(--surface))] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <input
              {...register("username")}
              placeholder="Username"
              onBlur={checkUsername}
              className="w-full rounded-xl border bg-[hsl(var(--surface))] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
            {checkingUsername && (
              <p className="mt-1 text-xs text-muted-foreground">Checking…</p>
            )}
            {usernameAvailable === true && (
              <p className="mt-1 text-xs text-green-600">Username available</p>
            )}
            {usernameAvailable === false && (
              <p className="mt-1 text-xs text-red-500">Username taken</p>
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
              <p className="mt-1 text-xs text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          <div>
            <input
              {...register("password")}
              type="password"
              placeholder="Password"
              className="w-full rounded-xl border bg-[hsl(var(--surface))] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div>
            <input
              {...register("confirmPassword")}
              type="password"
              placeholder="Confirm password"
              className="w-full rounded-xl border bg-[hsl(var(--surface))] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || usernameAvailable === false}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogle}
          className="w-full rounded-xl border py-3 text-sm font-medium transition hover:bg-[hsl(var(--muted))]"
        >
          Continue with Google
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

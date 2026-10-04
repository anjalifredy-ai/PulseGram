"use client";

import { create } from "zustand";
import type { User } from "firebase/auth";
import type { UserProfile } from "@/types";
import {
  subscribeToAuth,
  getUserProfile,
  logout as firebaseLogout,
} from "@/lib/auth/auth-service";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  refreshProfile: async () => {
    const { user } = get();
    if (!user) {
      set({ profile: null });
      return;
    }
    const profile = await getUserProfile(user.uid);
    set({ profile });
  },

  logout: async () => {
    await firebaseLogout();
    set({ user: null, profile: null });
  },

  init: () => {
    const unsub = subscribeToAuth(async (user) => {
      set({ user, loading: true });
      if (user) {
        const profile = await getUserProfile(user.uid);
        set({ profile, loading: false, initialized: true });
      } else {
        set({ profile: null, loading: false, initialized: true });
      }
    });
    return unsub;
  },
}));

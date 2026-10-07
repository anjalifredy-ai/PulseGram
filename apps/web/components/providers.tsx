"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { setupPresence } from "@/lib/presence";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const unsub = init();
    return unsub;
  }, [init]);

  // Online presence
  useEffect(() => {
    if (!user) return;
    const unsub = setupPresence(user.uid);
    return unsub;
  }, [user]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        theme="system"
        toastOptions={{
          className: "font-sans",
        }}
      />
    </QueryClientProvider>
  );
}

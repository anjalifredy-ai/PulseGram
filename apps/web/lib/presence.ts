"use client";

import { ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";

/**
 * Online presence via Firebase Realtime Database.
 * Path: presence/{uid} = { online: true, lastSeen: timestamp }
 */
export function setupPresence(uid: string) {
  const statusRef = ref(rtdb, `presence/${uid}`);
  const connectedRef = ref(rtdb, ".info/connected");

  const unsub = onValue(connectedRef, (snap) => {
    if (snap.val() === false) return;

    onDisconnect(statusRef)
      .set({ online: false, lastSeen: serverTimestamp() })
      .then(() => {
        set(statusRef, { online: true, lastSeen: serverTimestamp() });
      });
  });

  return unsub;
}

export function subscribeToPresence(
  uid: string,
  callback: (online: boolean, lastSeen?: number) => void
) {
  const statusRef = ref(rtdb, `presence/${uid}`);
  return onValue(statusRef, (snap) => {
    const val = snap.val();
    if (!val) {
      callback(false);
      return;
    }
    callback(!!val.online, val.lastSeen ?? undefined);
  });
}

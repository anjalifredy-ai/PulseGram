import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  deleteDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Call, CallStatus } from "@/types";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// Optional TURN from env
if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_TURN_URL) {
  ICE_SERVERS.push({
    urls: process.env.NEXT_PUBLIC_TURN_URL,
    username: process.env.NEXT_PUBLIC_TURN_USERNAME,
    credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
  });
}

export function createPeerConnection() {
  return new RTCPeerConnection({ iceServers: ICE_SERVERS });
}

export async function startCall(params: {
  callerId: string;
  calleeId: string;
  type: "voice" | "video";
}): Promise<string> {
  const ref = doc(collection(db, "calls"));
  const call: Call = {
    id: ref.id,
    type: params.type,
    callerId: params.callerId,
    calleeId: params.calleeId,
    status: "ringing",
    createdAt: Date.now(),
  };
  await setDoc(ref, call);
  return ref.id;
}

export async function updateCallStatus(
  callId: string,
  status: CallStatus,
  extra?: Partial<Call>
) {
  await updateDoc(doc(db, "calls", callId), {
    status,
    ...extra,
    ...(status === "connected" ? { startedAt: Date.now() } : {}),
    ...(status === "ended" || status === "missed" || status === "declined"
      ? { endedAt: Date.now() }
      : {}),
  });
}

export function subscribeToCall(
  callId: string,
  callback: (call: Call | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "calls", callId), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as Call);
  });
}

export async function sendSignal(
  callId: string,
  from: string,
  signal: {
    type: "offer" | "answer" | "ice";
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  }
) {
  await addDoc(collection(db, "calls", callId, "signaling"), {
    from,
    ...signal,
    createdAt: Date.now(),
  });
}

export function subscribeToSignals(
  callId: string,
  myUid: string,
  callback: (signal: {
    type: "offer" | "answer" | "ice";
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
    from: string;
  }) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, "calls", callId, "signaling"),
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type !== "added") return;
        const data = change.doc.data();
        if (data.from === myUid) return; // ignore own
        callback(data as any);
      });
    }
  );
}

export async function getUserMedia(type: "voice" | "video") {
  return navigator.mediaDevices.getUserMedia({
    audio: true,
    video: type === "video" ? { facingMode: "user" } : false,
  });
}

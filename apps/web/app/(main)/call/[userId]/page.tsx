"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import {
  startCall,
  updateCallStatus,
  subscribeToCall,
  sendSignal,
  subscribeToSignals,
  createPeerConnection,
  getUserMedia,
} from "@/lib/webrtc/call-service";
import type { Call } from "@/types";

export default function CallPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const calleeId = params.userId as string;
  const type = (search.get("type") === "video" ? "video" : "voice") as "voice" | "video";
  const { user } = useAuthStore();

  const [call, setCall] = useState<Call | null>(null);
  const [status, setStatus] = useState<string>("Connecting…");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let unsubCall: (() => void) | undefined;
    let unsubSignals: (() => void) | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function init() {
      try {
        const stream = await getUserMedia(type);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = createPeerConnection();
        pcRef.current = pc;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        pc.ontrack = (ev) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = ev.streams[0];
          }
        };

        pc.onicecandidate = (ev) => {
          if (ev.candidate && callIdRef.current) {
            sendSignal(callIdRef.current, user!.uid, {
              type: "ice",
              candidate: ev.candidate.toJSON(),
            });
          }
        };

        const callId = await startCall({
          callerId: user!.uid,
          calleeId,
          type,
        });
        callIdRef.current = callId;

        unsubCall = subscribeToCall(callId, (c) => {
          setCall(c);
          if (!c) return;
          if (c.status === "connected") {
            setStatus("Connected");
            timer = setInterval(() => setDuration((d) => d + 1), 1000);
          } else if (c.status === "ended" || c.status === "declined" || c.status === "missed") {
            setStatus(c.status);
            cleanup();
            setTimeout(() => router.back(), 1500);
          } else {
            setStatus(c.status === "ringing" ? "Ringing…" : c.status);
          }
        });

        unsubSignals = subscribeToSignals(callId, user!.uid, async (signal) => {
          if (!pcRef.current) return;
          if (signal.type === "answer" && signal.sdp) {
            await pcRef.current.setRemoteDescription(signal.sdp);
          } else if (signal.type === "offer" && signal.sdp) {
            await pcRef.current.setRemoteDescription(signal.sdp);
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            await sendSignal(callId, user!.uid, { type: "answer", sdp: answer });
          } else if (signal.type === "ice" && signal.candidate) {
            try {
              await pcRef.current.addIceCandidate(signal.candidate);
            } catch {}
          }
        });

        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal(callId, user!.uid, { type: "offer", sdp: offer });
        setStatus("Ringing…");
      } catch (e: any) {
        console.error(e);
        setStatus(e?.message ?? "Failed to start call");
      }
    }

    function cleanup() {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      if (timer) clearInterval(timer);
    }

    init();
    return () => {
      unsubCall?.();
      unsubSignals?.();
      cleanup();
    };
  }, [user, calleeId, type, router]);

  const endCall = async () => {
    if (callIdRef.current) {
      await updateCallStatus(callIdRef.current, "ended", {
        durationSeconds: duration,
      });
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    router.back();
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = muted;
    });
    setMuted(!muted);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = cameraOff;
    });
    setCameraOff(!cameraOff);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col">
      {type === "video" && (
        <>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-4 right-4 h-36 w-28 rounded-2xl object-cover border border-white/20 z-10"
          />
        </>
      )}

      <div className="relative z-20 flex-1 flex flex-col items-center justify-center gap-4 p-6">
        {type === "voice" && (
          <div className="h-28 w-28 rounded-full bg-brand-600/30 flex items-center justify-center text-4xl font-bold">
            📞
          </div>
        )}
        <p className="text-lg font-medium">{status}</p>
        {duration > 0 && (
          <p className="text-sm text-white/70 tabular-nums">{formatDuration(duration)}</p>
        )}
      </div>

      <div className="relative z-20 flex items-center justify-center gap-6 pb-12 safe-bottom">
        <button
          onClick={toggleMute}
          className="h-14 w-14 rounded-full bg-white/15 flex items-center justify-center"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>

        {type === "video" && (
          <button
            onClick={toggleCamera}
            className="h-14 w-14 rounded-full bg-white/15 flex items-center justify-center"
            aria-label={cameraOff ? "Camera on" : "Camera off"}
          >
            {cameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </button>
        )}

        <button
          onClick={endCall}
          className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center"
          aria-label="End call"
        >
          <PhoneOff className="h-7 w-7" />
        </button>

        <button
          className="h-14 w-14 rounded-full bg-white/15 flex items-center justify-center"
          aria-label="Speaker"
        >
          <Volume2 className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

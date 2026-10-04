"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Phone, Video } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import {
  subscribeToMessages,
  sendMessage,
} from "@/lib/chat/messaging";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    const unsub = subscribeToMessages(conversationId, setMessages);
    return unsub;
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !text.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage({
        conversationId,
        senderId: user.uid,
        type: "text",
        text: text.trim(),
      });
      setText("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh max-w-lg mx-auto bg-[hsl(var(--background))]">
      <header className="flex items-center gap-3 px-3 h-14 border-b shrink-0">
        <button onClick={() => router.back()} aria-label="Back">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">Chat</p>
        </div>
        <button aria-label="Voice call" className="p-2">
          <Phone className="h-5 w-5" />
        </button>
        <button aria-label="Video call" className="p-2">
          <Video className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {messages.map((m) => {
          const mine = m.senderId === user?.uid;
          return (
            <div
              key={m.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                  mine
                    ? "bg-brand-600 text-white rounded-br-md"
                    : "bg-[hsl(var(--muted))] rounded-bl-md"
                )}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex items-center gap-2 safe-bottom">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Message…"
          className="flex-1 rounded-full border bg-[hsl(var(--surface))] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="h-10 w-10 rounded-full bg-brand-600 text-white flex items-center justify-center disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

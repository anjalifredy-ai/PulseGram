import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  getDoc,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Conversation, Message, MessageType } from "@/types";

export async function getOrCreateDirectConversation(
  uid1: string,
  uid2: string
): Promise<string> {
  const members = [uid1, uid2].sort();
  const existingQ = query(
    collection(db, "conversations"),
    where("type", "==", "direct"),
    where("memberIds", "==", members)
  );
  const snap = await getDocs(existingQ);
  if (!snap.empty) return snap.docs[0].id;

  const ref = doc(collection(db, "conversations"));
  await setDoc(ref, {
    type: "direct",
    memberIds: members,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return ref.id;
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaDuration?: number;
  replyToId?: string;
}): Promise<string> {
  const { conversationId, senderId, type, text, mediaUrl, mediaDuration, replyToId } =
    params;

  const msgRef = doc(collection(db, "conversations", conversationId, "messages"));
  const now = Date.now();

  await setDoc(msgRef, {
    id: msgRef.id,
    conversationId,
    senderId,
    type,
    text: text ?? null,
    mediaUrl: mediaUrl ?? null,
    mediaDuration: mediaDuration ?? null,
    replyToId: replyToId ?? null,
    status: "sent",
    createdAt: now,
  });

  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: {
      text: text ?? (type === "image" ? "📷 Photo" : type === "video" ? "🎥 Video" : type === "audio" ? "🎤 Voice" : "Attachment"),
      senderId,
      type,
      createdAt: now,
    },
    updatedAt: now,
  });

  return msgRef.id;
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
  pageSize = 50
): Unsubscribe {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  return onSnapshot(q, (snap) => {
    const msgs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Message))
      .reverse();
    callback(msgs);
  });
}

export function subscribeToConversations(
  uid: string,
  callback: (conversations: Conversation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "conversations"),
    where("memberIds", "array-contains", uid),
    orderBy("updatedAt", "desc"),
    limit(40)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Conversation)
    );
    callback(list);
  });
}

export async function createGroupConversation(params: {
  creatorId: string;
  memberIds: string[];
  name: string;
  photoURL?: string;
}): Promise<string> {
  const members = Array.from(new Set([params.creatorId, ...params.memberIds]));
  const ref = doc(collection(db, "conversations"));
  await setDoc(ref, {
    type: "group",
    memberIds: members,
    adminIds: [params.creatorId],
    name: params.name,
    photoURL: params.photoURL ?? null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return ref.id;
}

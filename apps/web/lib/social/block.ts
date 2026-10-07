import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

function blockId(blockerId: string, blockedId: string) {
  return `${blockerId}_${blockedId}`;
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new Error("Cannot block yourself");

  const batch = writeBatch(db);

  batch.set(doc(db, "blocks", blockId(blockerId, blockedId)), {
    blockerId,
    blockedId,
    createdAt: Date.now(),
  });

  // Remove follow relations both ways if they exist
  const followAB = doc(db, "follows", `${blockerId}_${blockedId}`);
  const followBA = doc(db, "follows", `${blockedId}_${blockerId}`);
  const [ab, ba] = await Promise.all([getDoc(followAB), getDoc(followBA)]);
  if (ab.exists()) batch.delete(followAB);
  if (ba.exists()) batch.delete(followBA);

  await batch.commit();
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await deleteDoc(doc(db, "blocks", blockId(blockerId, blockedId)));
}

export async function isBlocked(
  blockerId: string,
  blockedId: string
): Promise<boolean> {
  const snap = await getDoc(doc(db, "blocks", blockId(blockerId, blockedId)));
  return snap.exists();
}

export async function getBlockedUsers(blockerId: string) {
  const q = query(
    collection(db, "blocks"),
    where("blockerId", "==", blockerId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as { blockerId: string; blockedId: string; createdAt: number });
}

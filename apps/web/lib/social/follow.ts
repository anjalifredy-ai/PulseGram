import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { FollowRelation } from "@/types";

function followId(followerId: string, followingId: string) {
  return `${followerId}_${followingId}`;
}

export async function followUser(
  followerId: string,
  followingId: string,
  targetIsPrivate: boolean
): Promise<"active" | "pending"> {
  if (followerId === followingId) throw new Error("Cannot follow yourself");

  const id = followId(followerId, followingId);
  const existing = await getDoc(doc(db, "follows", id));
  if (existing.exists()) {
    return (existing.data() as FollowRelation).status as "active" | "pending";
  }

  const status = targetIsPrivate ? "pending" : "active";
  const batch = writeBatch(db);

  batch.set(doc(db, "follows", id), {
    id,
    followerId,
    followingId,
    status,
    createdAt: Date.now(),
  });

  if (status === "active") {
    batch.update(doc(db, "users", followerId), {
      followingCount: increment(1),
      updatedAt: Date.now(),
    });
    batch.update(doc(db, "users", followingId), {
      followersCount: increment(1),
      updatedAt: Date.now(),
    });
  }

  // Notification
  const notifRef = doc(collection(db, "notifications"));
  batch.set(notifRef, {
    recipientId: followingId,
    actorId: followerId,
    type: targetIsPrivate ? "follow_request" : "follow",
    targetId: followerId,
    targetType: "user",
    isRead: false,
    createdAt: Date.now(),
  });

  await batch.commit();
  return status;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const id = followId(followerId, followingId);
  const snap = await getDoc(doc(db, "follows", id));
  if (!snap.exists()) return;

  const data = snap.data() as FollowRelation;
  const batch = writeBatch(db);
  batch.delete(doc(db, "follows", id));

  if (data.status === "active") {
    batch.update(doc(db, "users", followerId), {
      followingCount: increment(-1),
      updatedAt: Date.now(),
    });
    batch.update(doc(db, "users", followingId), {
      followersCount: increment(-1),
      updatedAt: Date.now(),
    });
  }

  await batch.commit();
}

export async function acceptFollowRequest(
  followerId: string,
  followingId: string
) {
  const id = followId(followerId, followingId);
  const snap = await getDoc(doc(db, "follows", id));
  if (!snap.exists() || (snap.data() as FollowRelation).status !== "pending") {
    return;
  }

  const batch = writeBatch(db);
  batch.update(doc(db, "follows", id), { status: "active" });
  batch.update(doc(db, "users", followerId), {
    followingCount: increment(1),
  });
  batch.update(doc(db, "users", followingId), {
    followersCount: increment(1),
  });

  const notifRef = doc(collection(db, "notifications"));
  batch.set(notifRef, {
    recipientId: followerId,
    actorId: followingId,
    type: "follow_accepted",
    targetId: followingId,
    targetType: "user",
    isRead: false,
    createdAt: Date.now(),
  });

  await batch.commit();
}

export async function rejectFollowRequest(
  followerId: string,
  followingId: string
) {
  const id = followId(followerId, followingId);
  await deleteDoc(doc(db, "follows", id));
}

export async function getFollowStatus(
  followerId: string,
  followingId: string
): Promise<"none" | "active" | "pending"> {
  const snap = await getDoc(doc(db, "follows", followId(followerId, followingId)));
  if (!snap.exists()) return "none";
  return (snap.data() as FollowRelation).status as "active" | "pending";
}

export async function getFollowers(uid: string) {
  const q = query(
    collection(db, "follows"),
    where("followingId", "==", uid),
    where("status", "==", "active")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as FollowRelation);
}

export async function getFollowing(uid: string) {
  const q = query(
    collection(db, "follows"),
    where("followerId", "==", uid),
    where("status", "==", "active")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as FollowRelation);
}

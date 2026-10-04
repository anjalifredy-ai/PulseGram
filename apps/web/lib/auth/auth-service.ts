import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { UserProfile, UserSettings } from "@/types";

const defaultSettings: UserSettings = {
  activityStatus: true,
  readReceipts: true,
  allowMessagesFrom: "everyone",
  allowTagsFrom: "everyone",
  allowMentionsFrom: "everyone",
  storyPrivacy: "followers",
  darkMode: "system",
  language: "en",
};

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const normalized = username.toLowerCase().trim();
  if (!/^[a-z0-9._]{3,30}$/.test(normalized)) return false;
  const snap = await getDoc(doc(db, "usernames", normalized));
  return !snap.exists();
}

export async function registerWithEmail(params: {
  email: string;
  password: string;
  username: string;
  displayName: string;
  dateOfBirth?: string;
}): Promise<UserProfile> {
  const { email, password, username, displayName } = params;
  const normalizedUsername = username.toLowerCase().trim();

  const available = await checkUsernameAvailable(normalizedUsername);
  if (!available) throw new Error("Username is already taken");

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  await updateProfile(cred.user, { displayName });

  const profile: UserProfile = {
    uid,
    username: normalizedUsername,
    displayName: displayName.trim(),
    email,
    photoURL: null,
    bio: "",
    website: null,
    isPrivate: false,
    isVerified: false,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    reelsCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: defaultSettings,
  };

  // Atomic-ish: username first so we can detect collisions
  await setDoc(doc(db, "usernames", normalizedUsername), {
    uid,
    createdAt: Date.now(),
  });

  await setDoc(doc(db, "users", uid), profile);

  return profile;
}

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const existing = await getDoc(doc(db, "users", user.uid));
  if (existing.exists()) {
    return existing.data() as UserProfile;
  }

  // First Google login → create profile skeleton (user must pick username)
  const skeleton: Partial<UserProfile> = {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "",
    photoURL: user.photoURL,
    bio: "",
    website: null,
    isPrivate: false,
    isVerified: false,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    reelsCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: defaultSettings,
  };

  await setDoc(doc(db, "users", user.uid), skeleton, { merge: true });
  return skeleton as UserProfile;
}

export async function completeGoogleProfile(
  uid: string,
  username: string,
  displayName: string
): Promise<UserProfile> {
  const normalized = username.toLowerCase().trim();
  const available = await checkUsernameAvailable(normalized);
  if (!available) throw new Error("Username is already taken");

  await setDoc(doc(db, "usernames", normalized), {
    uid,
    createdAt: Date.now(),
  });

  await updateDoc(doc(db, "users", uid), {
    username: normalized,
    displayName: displayName.trim(),
    updatedAt: Date.now(),
  });

  const snap = await getDoc(doc(db, "users", uid));
  return snap.data() as UserProfile;
}

export async function logout() {
  await signOut(auth);
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const unameSnap = await getDoc(doc(db, "usernames", username.toLowerCase()));
  if (!unameSnap.exists()) return null;
  const { uid } = unameSnap.data() as { uid: string };
  return getUserProfile(uid);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

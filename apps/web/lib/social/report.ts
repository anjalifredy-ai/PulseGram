import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type ReportTargetType = "user" | "post" | "reel" | "comment" | "message" | "story";

export async function submitReport(params: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
}) {
  await addDoc(collection(db, "reports"), {
    ...params,
    status: "pending",
    createdAt: Date.now(),
  });
}

export const REPORT_REASONS = [
  "Spam",
  "Harassment or bullying",
  "Hate speech",
  "Nudity or sexual content",
  "Violence",
  "False information",
  "Intellectual property",
  "Something else",
] as const;

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  type UploadTask,
} from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import imageCompression from "browser-image-compression";

export type UploadProgress = {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
};

export type UploadResult = {
  url: string;
  path: string;
  contentType: string;
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export function isImage(file: File) {
  return IMAGE_TYPES.includes(file.type) || file.type.startsWith("image/");
}

export function isVideo(file: File) {
  return VIDEO_TYPES.includes(file.type) || file.type.startsWith("video/");
}

export async function compressImage(file: File, maxSizeMB = 1.2): Promise<File> {
  if (!isImage(file)) return file;
  try {
    return await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/jpeg",
    });
  } catch {
    return file;
  }
}

export function uploadMedia(
  file: File,
  path: string,
  onProgress?: (p: UploadProgress) => void
): { task: UploadTask; promise: Promise<UploadResult> } {
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "application/octet-stream",
  });

  const promise = new Promise<UploadResult>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({
          progress,
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
        });
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({
          url,
          path,
          contentType: file.type,
        });
      }
    );
  });

  return { task, promise };
}

export async function uploadPostMedia(
  uid: string,
  files: File[],
  onProgress?: (index: number, p: UploadProgress) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    if (isImage(file)) {
      file = await compressImage(file);
    }
    const ext = file.name.split(".").pop() || (isVideo(file) ? "mp4" : "jpg");
    const path = `users/${uid}/posts/${Date.now()}_${i}.${ext}`;
    const { promise } = uploadMedia(file, path, (p) => onProgress?.(i, p));
    results.push(await promise);
  }
  return results;
}

export async function uploadStoryMedia(
  uid: string,
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<UploadResult> {
  let f = file;
  if (isImage(f)) f = await compressImage(f, 0.8);
  const ext = f.name.split(".").pop() || (isVideo(f) ? "mp4" : "jpg");
  const path = `users/${uid}/stories/${Date.now()}.${ext}`;
  const { promise } = uploadMedia(f, path, onProgress);
  return promise;
}

export async function uploadReelVideo(
  uid: string,
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<UploadResult> {
  const ext = file.name.split(".").pop() || "mp4";
  const path = `users/${uid}/reels/${Date.now()}.${ext}`;
  const { promise } = uploadMedia(file, path, onProgress);
  return promise;
}

export async function uploadProfilePhoto(
  uid: string,
  file: File
): Promise<UploadResult> {
  const compressed = await compressImage(file, 0.5);
  const path = `users/${uid}/avatar/${Date.now()}.jpg`;
  const { promise } = uploadMedia(compressed, path);
  return promise;
}

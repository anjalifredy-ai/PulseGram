export type UserProfile = {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  bio: string;
  website: string | null;
  pronouns?: string | null;
  isPrivate: boolean;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  reelsCount: number;
  createdAt: number;
  updatedAt: number;
  lastSeenAt?: number;
  isOnline?: boolean;
  fcmTokens?: string[];
  settings?: UserSettings;
};

export type UserSettings = {
  activityStatus: boolean;
  readReceipts: boolean;
  allowMessagesFrom: "everyone" | "following" | "nobody";
  allowTagsFrom: "everyone" | "following" | "nobody";
  allowMentionsFrom: "everyone" | "following" | "nobody";
  storyPrivacy: "everyone" | "followers" | "close_friends" | "custom";
  darkMode: "system" | "light" | "dark";
  language: string;
};

export type PostMedia = {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  altText?: string;
};

export type Post = {
  id: string;
  authorId: string;
  author?: Pick<UserProfile, "uid" | "username" | "displayName" | "photoURL" | "isVerified">;
  caption: string;
  media: PostMedia[];
  location?: string | null;
  music?: MusicInfo | null;
  hashtags: string[];
  mentions: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type MusicInfo = {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  previewUrl?: string;
  startMs?: number;
  durationMs?: number;
};

export type Story = {
  id: string;
  authorId: string;
  author?: Pick<UserProfile, "uid" | "username" | "displayName" | "photoURL">;
  mediaUrl: string;
  mediaType: "image" | "video" | "text";
  duration: number;
  caption?: string;
  music?: MusicInfo | null;
  viewersCount: number;
  reactionsCount: number;
  expiresAt: number;
  createdAt: number;
  isSeen?: boolean;
  privacy: "everyone" | "close_friends" | "custom";
};

export type Reel = {
  id: string;
  authorId: string;
  author?: Pick<UserProfile, "uid" | "username" | "displayName" | "photoURL" | "isVerified">;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  music?: MusicInfo | null;
  originalAudio?: boolean;
  hashtags: string[];
  mentions: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: number;
};

export type Comment = {
  id: string;
  postId?: string;
  reelId?: string;
  authorId: string;
  author?: Pick<UserProfile, "uid" | "username" | "displayName" | "photoURL">;
  text: string;
  parentId?: string | null;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  isPinned?: boolean;
  createdAt: number;
  updatedAt?: number;
};

export type Conversation = {
  id: string;
  type: "direct" | "group";
  memberIds: string[];
  members?: Pick<UserProfile, "uid" | "username" | "displayName" | "photoURL" | "isOnline">[];
  name?: string;
  photoURL?: string | null;
  lastMessage?: {
    text: string;
    senderId: string;
    type: MessageType;
    createdAt: number;
  };
  unreadCount?: number;
  updatedAt: number;
  createdAt: number;
  adminIds?: string[];
};

export type MessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "post"
  | "reel"
  | "profile"
  | "story_reply"
  | "system";

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaDuration?: number;
  replyToId?: string | null;
  reactions?: Record<string, string[]>;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  createdAt: number;
  updatedAt?: number;
  deletedFor?: string[];
};

export type CallStatus =
  | "ringing"
  | "connecting"
  | "connected"
  | "ended"
  | "missed"
  | "declined"
  | "failed";

export type Call = {
  id: string;
  type: "voice" | "video";
  callerId: string;
  calleeId: string;
  status: CallStatus;
  startedAt?: number;
  endedAt?: number;
  durationSeconds?: number;
  createdAt: number;
};

export type NotificationType =
  | "like"
  | "comment"
  | "comment_reply"
  | "follow"
  | "follow_request"
  | "follow_accepted"
  | "mention"
  | "story_reply"
  | "story_reaction"
  | "message"
  | "missed_call"
  | "system";

export type AppNotification = {
  id: string;
  recipientId: string;
  actorId: string;
  actor?: Pick<UserProfile, "uid" | "username" | "displayName" | "photoURL">;
  type: NotificationType;
  targetId?: string;
  targetType?: "post" | "reel" | "story" | "comment" | "user" | "call";
  text?: string;
  isRead: boolean;
  createdAt: number;
};

export type FollowRelation = {
  id: string;
  followerId: string;
  followingId: string;
  status: "active" | "pending" | "blocked";
  createdAt: number;
};

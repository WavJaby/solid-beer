export interface UserPublicInfo {
  id: string;
  username?: string;
  nickname?: string;
  avatarUrl?: string;
}

export interface UserDetail extends UserPublicInfo {
  email?: string;
  firstname?: string;
  lastname?: string;
  role?: string;
  registerTime?: number;
  lastLoginTime?: number;
  fcmToken?: string;
}

export type ImageSource = string | Blob;

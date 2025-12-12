export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}
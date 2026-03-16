export type UserProvider = 'guest' | 'google';

export type User = {
  id: string;
  username: string;
  email: string | null;
  provider: UserProvider;
  avatarUrl: string | null;
  createdAt: string;
  nakamaUserId?: string;
};

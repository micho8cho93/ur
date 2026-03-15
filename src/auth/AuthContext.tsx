import { createContext } from 'react';

import { User } from '@/src/types/user';

export type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

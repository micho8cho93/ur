import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { User } from '@/src/types/user';

type StoredAuthSession = {
  version: 1;
  user: User;
  nakamaSessionToken?: string;
  nakamaRefreshToken?: string;
};

const AUTH_SESSION_KEY = 'auth.session.v1';
const AUTH_SESSION_VERSION = 1;

const isStoredUser = (value: unknown): value is User => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<User>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.username === 'string' &&
    typeof candidate.createdAt === 'string' &&
    (candidate.provider === 'guest' || candidate.provider === 'google')
  );
};

const getWebStorage = (): Storage | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage;
};

const removeStoredSession = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(AUTH_SESSION_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
};

export const saveSession = async (
  user: User,
  nakamaSessionToken?: string,
  nakamaRefreshToken?: string
): Promise<void> => {
  const session: StoredAuthSession = {
    version: AUTH_SESSION_VERSION,
    user,
    nakamaSessionToken,
    nakamaRefreshToken,
  };

  const value = JSON.stringify(session);

  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(AUTH_SESSION_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(AUTH_SESSION_KEY, value);
};

export type LoadedSession = {
  user: User;
  nakamaSessionToken?: string;
  nakamaRefreshToken?: string;
};

export const loadSession = async (): Promise<LoadedSession | null> => {
  const rawValue =
    Platform.OS === 'web'
      ? getWebStorage()?.getItem(AUTH_SESSION_KEY) ?? null
      : await SecureStore.getItemAsync(AUTH_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredAuthSession>;

    if (parsed.version !== AUTH_SESSION_VERSION || !isStoredUser(parsed.user)) {
      await removeStoredSession();
      return null;
    }

    return {
      user: {
        ...parsed.user,
        email: parsed.user.email ?? null,
        avatarUrl: parsed.user.avatarUrl ?? null,
      },
      nakamaSessionToken: parsed.nakamaSessionToken,
      nakamaRefreshToken: parsed.nakamaRefreshToken,
    };
  } catch {
    await removeStoredSession();
    return null;
  }
};

export const loadStoredUser = async (): Promise<User | null> => {
  const session = await loadSession();
  return session?.user ?? null;
};

export const clearSession = async (): Promise<void> => {
  await removeStoredSession();
};

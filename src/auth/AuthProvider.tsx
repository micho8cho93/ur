import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

import { nakamaService } from '@/services/nakama';
import { useGameStore } from '@/store/useGameStore';
import { User } from '@/src/types/user';

import { AuthContext } from './AuthContext';
import { createGuestUser } from './guestAuth';
import { useGoogleAuth } from './googleAuth';
import { clearSession, loadSession, saveSession } from './sessionStorage';

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { login: loginWithGoogleRequest } = useGoogleAuth();

  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      try {
        const restoredUser = await loadSession();
        if (isMounted) {
          setUser(restoredUser);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const loginAsGuest = useCallback(async () => {
    const guestUser = createGuestUser();
    await saveSession(guestUser);
    setUser(guestUser);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const result = await loginWithGoogleRequest();

    if (!result) {
      return;
    }

    await saveSession(result.user);
    setUser(result.user);
  }, [loginWithGoogleRequest]);

  const logout = useCallback(async () => {
    await clearSession();
    await nakamaService.clearSession();
    useGameStore.getState().reset();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      loginWithGoogle,
      loginAsGuest,
      logout,
    }),
    [isLoading, loginAsGuest, loginWithGoogle, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

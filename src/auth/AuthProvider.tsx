import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { Session } from '@heroiclabs/nakama-js';

import { nakamaService } from '@/services/nakama';
import { useGameStore } from '@/store/useGameStore';
import { User } from '@/src/types/user';

import { AuthContext } from './AuthContext';
import { loginAsGuest as guestLogin } from './guestAuth';
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
        const loaded = await loadSession();
        if (!loaded || !isMounted) {
          return;
        }

        if (loaded.nakamaSessionToken && loaded.nakamaRefreshToken) {
          try {
            const restored = Session.restore(loaded.nakamaSessionToken, loaded.nakamaRefreshToken);

            if (restored.isexpired(Date.now() / 1000)) {
              if (restored.refresh_token) {
                const refreshed = await nakamaService.getClient().sessionRefresh(restored);
                await saveSession(loaded.user, refreshed.token, refreshed.refresh_token);
              } else {
                await clearSession();
                return;
              }
            }
          } catch (error) {
            console.error('Failed to restore Nakama session:', error);
            await clearSession();
            return;
          }
        }

        if (isMounted) {
          setUser(loaded.user);
        }
      } catch (error) {
        console.error('Failed to hydrate session:', error);
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
    try {
      const { user, session } = await guestLogin();
      await saveSession(user, session.token, session.refresh_token);
      setUser(user);
    } catch (error) {
      throw new Error(`Guest login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await loginWithGoogleRequest();

      if (!result) {
        return;
      }

      await saveSession(result.user, result.nakamaSession.token, result.nakamaSession.refresh_token);
      setUser(result.user);
    } catch (error) {
      throw new Error(`Google login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [loginWithGoogleRequest]);

  const logout = useCallback(async () => {
    await clearSession();
    await nakamaService.clearSession();
    useGameStore.getState().reset();
    setUser(null);
  }, []);

  const linkGoogleAccount = useCallback(async () => {
    if (!user || user.provider !== 'guest') {
      throw new Error('Can only link Google account to guest accounts');
    }

    try {
      const result = await loginWithGoogleRequest();

      if (!result) {
        return;
      }

      await nakamaService.linkGoogle(result.idToken!);

      const updatedUser: User = {
        ...result.user,
        provider: 'google',
      };

      await saveSession(updatedUser, result.nakamaSession.token, result.nakamaSession.refresh_token);
      setUser(updatedUser);
    } catch (error) {
      throw new Error(`Account linking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [user, loginWithGoogleRequest]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      loginWithGoogle,
      loginAsGuest,
      logout,
      linkGoogleAccount,
    }),
    [isLoading, linkGoogleAccount, loginAsGuest, loginWithGoogle, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

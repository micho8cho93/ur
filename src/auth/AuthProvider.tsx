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
  const [hasInitialized, setHasInitialized] = useState(false);
  const { login: loginWithGoogleRequest, isProcessing: isGoogleAuthProcessing } = useGoogleAuth();

  const hydrateSession = useCallback(async () => {
    try {
      const loaded = await loadSession();
      if (!loaded) {
        return null;
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
              return null;
            }
          }
        } catch (error) {
          console.error('Failed to restore Nakama session:', error);
          await clearSession();
          return null;
        }
      }

      return loaded.user;
    } catch (error) {
      console.error('Failed to hydrate session:', error);
      return null;
    }
  }, []);

  // Initial session hydration on mount
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const restoredUser = await hydrateSession();
      if (isMounted) {
        setUser(restoredUser);
        setIsLoading(false);
        setHasInitialized(true);
      }
    };

    void initialize();

    return () => {
      isMounted = false;
    };
  }, [hydrateSession]);

  // When Google auth finishes processing (after redirect), reload session
  // Only runs during initial load, not after manual logout
  useEffect(() => {
    if (hasInitialized && !isGoogleAuthProcessing && !user && isLoading) {
      let isMounted = true;

      const checkForNewSession = async () => {
        const restoredUser = await hydrateSession();
        if (restoredUser && isMounted) {
          setUser(restoredUser);
        }
        if (isMounted) {
          setIsLoading(false);
        }
      };

      void checkForNewSession();

      return () => {
        isMounted = false;
      };
    }
  }, [hasInitialized, isGoogleAuthProcessing, user, isLoading, hydrateSession]);

  // Safety timeout: ensure loading state clears after reasonable time
  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timeout = setTimeout(() => {
      console.warn('Authentication loading timeout - forcing loading state to clear');
      setIsLoading(false);
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

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
      // On web with redirects, this promise may never resolve (component unmounts)
      // The session will be saved by useGoogleAuth and picked up by the effect monitoring isGoogleAuthProcessing
      const result = await loginWithGoogleRequest();

      if (!result) {
        // User cancelled
        return;
      }

      // This only runs if we get a direct result (non-redirect flow)
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

      await nakamaService.linkGoogle(result.idToken);

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

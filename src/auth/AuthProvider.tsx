import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Session } from '@heroiclabs/nakama-js';

import { nakamaService } from '@/services/nakama';
import { startAuthenticatedPresence, stopAuthenticatedPresence } from '@/services/presenceManager';
import {
  claimUsername as claimUsernameRpc,
  getUsernameOnboardingStatus,
  updateAccountDisplayName,
} from '@/services/usernameOnboarding';
import type {
  ClaimUsernameRpcResponse,
  UsernameOnboardingStatusRpcResponse,
} from '@/shared/usernameOnboarding';
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
  const [usernameOnboardingStatus, setUsernameOnboardingStatus] = useState<UsernameOnboardingStatusRpcResponse | null>(null);
  const [isUsernameOnboardingLoading, setIsUsernameOnboardingLoading] = useState(false);
  const [usernameOnboardingError, setUsernameOnboardingError] = useState<string | null>(null);
  const { login: loginWithGoogleRequest, isProcessing: isGoogleAuthProcessing } = useGoogleAuth();
  const onboardingRequestIdRef = useRef(0);
  const activeOnboardingUserIdRef = useRef<string | null>(null);

  const syncPresenceForSession = useCallback((
    session?: Pick<Session, 'token' | 'refresh_token'> | null,
    nextUser?: User | null,
    nextStatus?: UsernameOnboardingStatusRpcResponse | null,
  ) => {
    const resolvedUser = nextUser ?? null;
    const resolvedStatus = nextStatus ?? null;
    const canUsePresence =
      resolvedUser?.provider !== 'google' || Boolean(resolvedStatus?.onboardingComplete);

    if (session?.token && session.refresh_token && resolvedUser && canUsePresence) {
      startAuthenticatedPresence();
      return;
    }

    stopAuthenticatedPresence();
  }, []);

  const getSessionRestoreStatus = (error: unknown): number | null => {
    if (typeof error !== 'object' || error === null) {
      return null;
    }

    const candidate = error as { status?: unknown };
    return typeof candidate.status === 'number' ? candidate.status : null;
  };

  const clearStoredAuth = useCallback(async () => {
    await clearSession();
    await nakamaService.clearSession();
  }, []);

  const resetUsernameOnboardingState = useCallback(() => {
    onboardingRequestIdRef.current += 1;
    activeOnboardingUserIdRef.current = null;
    setUsernameOnboardingStatus(null);
    setUsernameOnboardingError(null);
    setIsUsernameOnboardingLoading(false);
  }, []);

  const persistUserSession = useCallback(async (nextUser: User, session?: Pick<Session, 'token' | 'refresh_token'> | null) => {
    const resolvedSession = session ?? (await nakamaService.loadSession());
    await saveSession(nextUser, resolvedSession?.token, resolvedSession?.refresh_token);
    setUser(nextUser);
  }, []);

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
              return {
                user: loaded.user,
                nakamaSessionToken: refreshed.token,
                nakamaRefreshToken: refreshed.refresh_token,
              };
            } else {
              await clearStoredAuth();
              return null;
            }
          }
        } catch (error) {
          if (getSessionRestoreStatus(error) === 401) {
            console.warn('Stored Nakama session expired; clearing cached auth.');
          } else {
            console.error('Failed to restore Nakama session:', error);
          }
          await clearStoredAuth();
          return null;
        }
      }

      return loaded;
    } catch (error) {
      console.error('Failed to hydrate session:', error);
      return null;
    }
  }, [clearStoredAuth]);

  // Initial session hydration on mount
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const restoredSession = await hydrateSession();
      if (isMounted) {
        setUser(restoredSession?.user ?? null);
        setIsLoading(false);
        setHasInitialized(true);
        syncPresenceForSession(
          restoredSession?.nakamaSessionToken && restoredSession?.nakamaRefreshToken
            ? {
                token: restoredSession.nakamaSessionToken,
                refresh_token: restoredSession.nakamaRefreshToken,
              }
            : null,
          restoredSession?.user ?? null,
        );
      }
    };

    void initialize();

    return () => {
      isMounted = false;
    };
  }, [hydrateSession, syncPresenceForSession]);

  // When Google auth finishes processing (after redirect), reload session
  // Only runs during initial load, not after manual logout
  useEffect(() => {
    if (hasInitialized && !isGoogleAuthProcessing && !user && isLoading) {
      let isMounted = true;

      const checkForNewSession = async () => {
        const restoredSession = await hydrateSession();
        if (restoredSession?.user && isMounted) {
          setUser(restoredSession.user);
        }
        if (isMounted) {
          syncPresenceForSession(
            restoredSession?.nakamaSessionToken && restoredSession?.nakamaRefreshToken
              ? {
                token: restoredSession.nakamaSessionToken,
                refresh_token: restoredSession.nakamaRefreshToken,
              }
              : null,
            restoredSession?.user ?? null,
          );
          setIsLoading(false);
        }
      };

      void checkForNewSession();

      return () => {
        isMounted = false;
      };
    }
  }, [hasInitialized, isGoogleAuthProcessing, user, isLoading, hydrateSession, syncPresenceForSession]);

  const refreshUsernameOnboardingStatus = useCallback(async (): Promise<UsernameOnboardingStatusRpcResponse | null> => {
    if (!user || user.provider !== 'google') {
      resetUsernameOnboardingState();
      return null;
    }

    onboardingRequestIdRef.current += 1;
    const requestId = onboardingRequestIdRef.current;

    setIsUsernameOnboardingLoading(true);
    setUsernameOnboardingError(null);

    try {
      const status = await getUsernameOnboardingStatus(user);

      if (onboardingRequestIdRef.current !== requestId) {
        return null;
      }

      activeOnboardingUserIdRef.current = user.id;
      setUsernameOnboardingStatus(status);
      syncPresenceForSession(nakamaService.getSession(), user, status);

      if (status.onboardingComplete && status.currentUsername && user.username !== status.currentUsername) {
        await persistUserSession(
          {
            ...user,
            username: status.currentUsername,
          },
          nakamaService.getSession(),
        );
      }

      return status;
    } catch (error) {
      if (onboardingRequestIdRef.current !== requestId) {
        return null;
      }

      const cachedStatusForUser =
        activeOnboardingUserIdRef.current === user.id ? usernameOnboardingStatus : null;
      setUsernameOnboardingError(
        error instanceof Error ? error.message : 'Unable to load username onboarding right now.',
      );
      syncPresenceForSession(nakamaService.getSession(), user, cachedStatusForUser);
      return cachedStatusForUser;
    } finally {
      if (onboardingRequestIdRef.current === requestId) {
        setIsUsernameOnboardingLoading(false);
      }
    }
  }, [persistUserSession, resetUsernameOnboardingState, syncPresenceForSession, user, usernameOnboardingStatus]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user || user.provider !== 'google') {
      resetUsernameOnboardingState();
      return;
    }

    if (activeOnboardingUserIdRef.current !== user.id) {
      void refreshUsernameOnboardingStatus();
    }
  }, [isLoading, refreshUsernameOnboardingStatus, resetUsernameOnboardingState, user]);

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
      await saveSession(user, session?.token, session?.refresh_token);
      setUser(user);
      resetUsernameOnboardingState();
      syncPresenceForSession(session, user, null);
    } catch (error) {
      throw new Error(`Guest login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [resetUsernameOnboardingState, syncPresenceForSession]);

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
      activeOnboardingUserIdRef.current = null;
      setUser(result.user);
      syncPresenceForSession(result.nakamaSession, result.user, null);
    } catch (error) {
      throw new Error(`Google login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [loginWithGoogleRequest, syncPresenceForSession]);

  const logout = useCallback(async () => {
    stopAuthenticatedPresence();
    await clearStoredAuth();
    useGameStore.getState().reset();
    resetUsernameOnboardingState();
    setUser(null);
  }, [clearStoredAuth, resetUsernameOnboardingState]);

  const claimUsername = useCallback(async (username: string): Promise<ClaimUsernameRpcResponse> => {
    if (!user || user.provider !== 'google') {
      throw new Error('Google sign-in is required to claim a username.');
    }

    const result = await claimUsernameRpc(username);

    if (!result.success) {
      setUsernameOnboardingError(result.errorMessage);
      return result;
    }

    const nextStatus: UsernameOnboardingStatusRpcResponse = {
      onboardingComplete: true,
      currentUsername: result.usernameDisplay,
      suggestedUsername: null,
    };
    const nextUser: User = {
      ...user,
      username: result.usernameDisplay,
    };

    activeOnboardingUserIdRef.current = user.id;
    setUsernameOnboardingStatus(nextStatus);
    setUsernameOnboardingError(null);

    await persistUserSession(nextUser, nakamaService.getSession());
    syncPresenceForSession(nakamaService.getSession(), nextUser, nextStatus);

    try {
      await updateAccountDisplayName(result.usernameDisplay);
    } catch (error) {
      console.warn('Failed to sync public username to Nakama display name:', error);
    }

    return result;
  }, [persistUserSession, syncPresenceForSession, user]);

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
      activeOnboardingUserIdRef.current = null;
      setUser(updatedUser);
      syncPresenceForSession(result.nakamaSession, updatedUser, null);
    } catch (error) {
      throw new Error(`Account linking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [user, loginWithGoogleRequest, syncPresenceForSession]);

  const isUsernameOnboardingBusy =
    user?.provider === 'google' &&
    (isUsernameOnboardingLoading ||
      (activeOnboardingUserIdRef.current !== user.id &&
        usernameOnboardingStatus === null &&
        usernameOnboardingError === null));

  const isUsernameOnboardingRequired =
    user?.provider === 'google' &&
    !isUsernameOnboardingBusy &&
    usernameOnboardingStatus?.onboardingComplete === false;

  const value = useMemo(
    () => ({
      user,
      isLoading,
      usernameOnboardingStatus,
      isUsernameOnboardingLoading: Boolean(isUsernameOnboardingBusy),
      usernameOnboardingError,
      isUsernameOnboardingRequired,
      refreshUsernameOnboardingStatus,
      claimUsername,
      loginWithGoogle,
      loginAsGuest,
      logout,
      linkGoogleAccount,
    }),
    [
      claimUsername,
      isLoading,
      isUsernameOnboardingBusy,
      isUsernameOnboardingRequired,
      linkGoogleAccount,
      loginAsGuest,
      loginWithGoogle,
      logout,
      refreshUsernameOnboardingStatus,
      user,
      usernameOnboardingError,
      usernameOnboardingStatus,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

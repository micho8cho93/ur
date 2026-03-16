import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Session } from '@heroiclabs/nakama-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { nakamaService } from '@/services/nakama';
import { User } from '@/src/types/user';

WebBrowser.maybeCompleteAuthSession();

type GoogleUserInfo = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

type PendingGoogleLogin = {
  resolve: (result: GoogleAuthResult | null) => void;
  reject: (error: Error) => void;
};

export type GoogleAuthResult = {
  user: User;
  idToken: string | null;
  accessToken: string;
  nakamaSession: Session;
};

const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({ path: 'oauthredirect' });

const resolveGoogleAuthError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error('Google sign-in failed. Please try again.');
};

const getGoogleAuthErrorMessage = (
  response: AuthSession.AuthSessionResult
): string => {
  if (!('params' in response)) {
    return 'Google sign-in failed.';
  }

  return response.error?.message ?? response.params.error_description ?? response.params.error ?? 'Google sign-in failed.';
};

const getNativeGoogleAuthMessage = (): string =>
  'Google sign-in on native requires EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID or EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID and a development build.';

const mapGoogleUser = (profile: GoogleUserInfo, nakamaUserId?: string): User => ({
  id: profile.sub,
  username: profile.name?.trim() || profile.email?.split('@')[0] || 'Google User',
  email: profile.email ?? null,
  avatarUrl: profile.picture ?? null,
  provider: 'google',
  createdAt: new Date().toISOString(),
  nakamaUserId,
});

const fetchGoogleUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Unable to load your Google profile.');
  }

  const payload = (await response.json()) as GoogleUserInfo;
  if (!payload.sub) {
    throw new Error('Google did not return a valid profile.');
  }

  return payload;
};

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID ?? 'missing-google-client-id',
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    redirectUri: GOOGLE_REDIRECT_URI,
    responseType: AuthSession.ResponseType.Code,
    shouldAutoExchangeCode: true,
    usePKCE: true,
    scopes: ['openid', 'profile', 'email'],
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingLoginRef = useRef<PendingGoogleLogin | null>(null);

  const settlePendingLogin = useCallback((handler: (pending: PendingGoogleLogin) => void) => {
    const pending = pendingLoginRef.current;
    if (!pending) {
      return;
    }

    pendingLoginRef.current = null;
    setIsProcessing(false);
    handler(pending);
  }, []);

  useEffect(() => {
    if (!response || !pendingLoginRef.current) {
      return;
    }

    if (response.type === 'cancel' || response.type === 'dismiss') {
      settlePendingLogin((pending) => pending.resolve(null));
      return;
    }

    if (response.type !== 'success') {
      settlePendingLogin((pending) => pending.reject(new Error(getGoogleAuthErrorMessage(response))));
      return;
    }

    let isCancelled = false;

    const finalizeGoogleLogin = async () => {
      try {
        const accessToken = response.authentication?.accessToken ?? response.params.access_token ?? null;
        const idToken = response.authentication?.idToken ?? response.params.id_token ?? null;

        if (!accessToken) {
          throw new Error('Google sign-in did not return an access token.');
        }

        if (!idToken) {
          throw new Error('Google sign-in did not return an ID token.');
        }

        const profile = await fetchGoogleUserInfo(accessToken);
        if (isCancelled) {
          return;
        }

        const nakamaSession = await nakamaService.authenticateGoogle(idToken, true);
        if (isCancelled) {
          return;
        }

        const nakamaAccount = await nakamaService.getAccount();
        if (isCancelled) {
          return;
        }

        settlePendingLogin((pending) =>
          pending.resolve({
            user: mapGoogleUser(profile, nakamaAccount.user?.id),
            idToken,
            accessToken,
            nakamaSession,
          })
        );
      } catch (error) {
        if (isCancelled) {
          return;
        }

        settlePendingLogin((pending) => pending.reject(resolveGoogleAuthError(error)));
      }
    };

    void finalizeGoogleLogin();

    return () => {
      isCancelled = true;
    };
  }, [response, settlePendingLogin]);

  useEffect(() => {
    return () => {
      const pending = pendingLoginRef.current;
      if (!pending) {
        return;
      }

      pendingLoginRef.current = null;
      pending.reject(new Error('Google sign-in was interrupted.'));
    };
  }, []);

  const login = useCallback(async (): Promise<GoogleAuthResult | null> => {
    if (Platform.OS !== 'web') {
      throw new Error(getNativeGoogleAuthMessage());
    }

    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
    }

    if (!request) {
      throw new Error('Google sign-in is still initializing.');
    }

    if (pendingLoginRef.current || isProcessing) {
      throw new Error('Google sign-in is already in progress.');
    }

    setIsProcessing(true);

    return new Promise<GoogleAuthResult | null>((resolve, reject) => {
      pendingLoginRef.current = { resolve, reject };

      promptAsync().catch((error) => {
        const pending = pendingLoginRef.current;
        pendingLoginRef.current = null;
        setIsProcessing(false);
        pending?.reject(resolveGoogleAuthError(error));
      });
    });
  }, [isProcessing, promptAsync, request]);

  return {
    isReady: Platform.OS === 'web' ? Boolean(request && GOOGLE_WEB_CLIENT_ID) && !isProcessing : true,
    login,
    redirectUri: GOOGLE_REDIRECT_URI,
  };
};

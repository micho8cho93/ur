import * as AuthSession from 'expo-auth-session';
import { Session } from '@heroiclabs/nakama-js';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { nakamaService } from '@/services/nakama';
import { User } from '@/src/types/user';
import { saveSession } from './sessionStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

type GoogleJwtPayload = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

type GISCredentialResponse = {
  credential: string;
};

type GISPromptNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason: () => string;
};

type GISWindow = Window & {
  google?: {
    accounts: {
      id: {
        initialize: (config: object) => void;
        prompt: (callback?: (n: GISPromptNotification) => void) => void;
        cancel: () => void;
      };
    };
  };
};

export type GoogleAuthResult = {
  user: User;
  accessToken: string;
  idToken: string;
  nakamaSession: Session;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({ path: 'oauthredirect' });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const resolveGoogleAuthError = (error: unknown): Error =>
  error instanceof Error ? error : new Error('Google sign-in failed. Please try again.');

const getNativeGoogleAuthMessage = (): string =>
  'Google sign-in on native requires EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID or EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID and a development build.';

/**
 * Decode the JWT payload. We do NOT verify the signature here —
 * Nakama verifies it server-side when we call authenticateGoogle.
 */
const decodeJwtPayload = (jwt: string): GoogleJwtPayload => {
  const parts = jwt.split('.');
  if (parts.length !== 3) throw new Error('Invalid ID token format.');
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(base64);
  const payload = JSON.parse(json) as Record<string, unknown>;
  if (!payload.sub) throw new Error('Google did not return a valid user ID.');
  return {
    sub: String(payload.sub),
    name: payload.name != null ? String(payload.name) : undefined,
    email: payload.email != null ? String(payload.email) : undefined,
    picture: payload.picture != null ? String(payload.picture) : undefined,
  };
};

const mapGoogleUser = (payload: GoogleJwtPayload, nakamaUserId?: string): User => ({
  id: payload.sub,
  username: payload.name?.trim() || payload.email?.split('@')[0] || 'Google User',
  email: payload.email ?? null,
  avatarUrl: payload.picture ?? null,
  provider: 'google',
  createdAt: new Date().toISOString(),
  nakamaUserId,
});

// ─── GIS script loader ────────────────────────────────────────────────────────

/**
 * Injects the Google Identity Services script once and resolves when ready.
 * Safe to call multiple times — subsequent calls resolve immediately if already loaded.
 */
const loadGISScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Not a browser environment.'));
      return;
    }

    const win = window as GISWindow;
    if (win.google?.accounts?.id) {
      resolve();
      return;
    }

    const SCRIPT_ID = 'google-gis-script';
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Google Identity Services.'))
      );
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(
        new Error(
          'Failed to load Google Identity Services. Check your internet connection.'
        )
      );
    document.head.appendChild(script);
  });

// ─── GIS sign-in prompt ───────────────────────────────────────────────────────

/**
 * Shows the Google One Tap / Sign In With Google prompt and resolves with
 * the raw ID token (credential JWT) on success, or null on user cancellation.
 *
 * Why GIS instead of expo-auth-session OAuth flows:
 *  - response_type=token   → Google blocked implicit flow for Web Application clients
 *  - response_type=code    → requires client_secret for code exchange; can't be done in a browser SPA
 *  - response_type=token id_token → also blocked (hybrid implicit flow)
 *  GIS bypasses all of this: it returns the ID token directly via a secure popup,
 *  with no code exchange and no client_secret required.
 */
const promptGISSignIn = (clientId: string): Promise<string | null> =>
  new Promise((resolve, reject) => {
    const win = window as GISWindow;
    if (!win.google?.accounts?.id) {
      reject(new Error('Google Identity Services failed to initialize.'));
      return;
    }

    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    win.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: GISCredentialResponse) => {
        settle(() => {
          if (!response?.credential) {
            reject(new Error('Google sign-in did not return a credential.'));
          } else {
            console.debug('[GoogleAuth] GIS credential received — proceeding with Nakama auth.');
            resolve(response.credential);
          }
        });
      },
      cancel_on_tap_outside: true,
    });

    win.google.accounts.id.prompt((notification: GISPromptNotification) => {
      if (notification.isNotDisplayed()) {
        settle(() =>
          reject(
            new Error(
              `Google sign-in could not be displayed (${notification.getNotDisplayedReason()}). ` +
                'Try enabling third-party cookies, or use a different browser.'
            )
          )
        );
      } else if (notification.isDismissedMoment() || notification.isSkippedMoment()) {
        // User closed the prompt — treat as cancellation
        settle(() => resolve(null));
      }
    });
  });

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useGoogleAuth = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const abortedRef = useRef(false);

  const login = useCallback(async (): Promise<GoogleAuthResult | null> => {
    if (Platform.OS !== 'web') {
      throw new Error(getNativeGoogleAuthMessage());
    }

    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
    }

    if (isProcessing) {
      throw new Error('Google sign-in is already in progress.');
    }

    setIsProcessing(true);
    abortedRef.current = false;

    try {
      await loadGISScript();
      if (abortedRef.current) return null;

      const idToken = await promptGISSignIn(GOOGLE_WEB_CLIENT_ID);
      if (idToken === null || abortedRef.current) {
        // User cancelled
        return null;
      }

      const payload = decodeJwtPayload(idToken);
      if (abortedRef.current) return null;

      const nakamaSession = await nakamaService.authenticateGoogle(idToken, true);
      if (abortedRef.current) return null;

      const nakamaAccount = await nakamaService.getAccount();
      if (abortedRef.current) return null;

      const user = mapGoogleUser(payload, nakamaAccount.user?.id);

      const authResult: GoogleAuthResult = {
        user,
        // GIS does not provide an access token — the ID token carries all identity
        // claims needed. accessToken kept in type for API compatibility.
        accessToken: '',
        idToken,
        nakamaSession,
      };

      await saveSession(user, nakamaSession.token, nakamaSession.refresh_token);
      return authResult;
    } catch (error) {
      throw resolveGoogleAuthError(error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  return {
    isReady: Platform.OS === 'web' ? Boolean(GOOGLE_WEB_CLIENT_ID) && !isProcessing : true,
    isProcessing,
    login,
    redirectUri: GOOGLE_REDIRECT_URI,
  };
};

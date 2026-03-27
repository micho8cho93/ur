/**
 * Presence manager — maintains a heartbeat loop while the user is authenticated.
 *
 * Usage:
 *   startAuthenticatedPresence()   — call after login or session restore
 *   stopAuthenticatedPresence()    — call on logout or session invalidation
 *
 * Guards against duplicate intervals; safe to call start() multiple times.
 */

import { sendPresenceHeartbeat } from './presence';

const HEARTBEAT_INTERVAL_MS = 15_000;

let intervalId: ReturnType<typeof setInterval> | null = null;

const isUnauthorizedPresenceError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    status?: unknown;
    statusCode?: unknown;
  };

  if (candidate.status === 401 || candidate.statusCode === 401 || candidate.code === 401) {
    return true;
  }

  return typeof candidate.message === 'string' && /unauthorized|expired|no active session/i.test(candidate.message);
};

const beat = async (): Promise<void> => {
  try {
    await sendPresenceHeartbeat();
    console.debug('[Presence] Heartbeat sent.');
  } catch (error) {
    console.warn('[Presence] Heartbeat failed:', error instanceof Error ? error.message : error);

    if (isUnauthorizedPresenceError(error)) {
      stopAuthenticatedPresence();
    }
  }
};

export const startAuthenticatedPresence = (): void => {
  if (intervalId !== null) {
    // Already running — nothing to do.
    return;
  }

  console.debug('[Presence] Starting heartbeat loop.');
  void beat(); // Immediate beat so the user appears online right away.
  intervalId = setInterval(() => void beat(), HEARTBEAT_INTERVAL_MS);
};

export const stopAuthenticatedPresence = (): void => {
  if (intervalId === null) {
    return;
  }

  console.debug('[Presence] Stopping heartbeat loop.');
  clearInterval(intervalId);
  intervalId = null;
};

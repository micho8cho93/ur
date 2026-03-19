import * as Crypto from 'expo-crypto';
import { Session } from '@heroiclabs/nakama-js';

import { getTransportMode } from '@/config/nakama';
import { nakamaService } from '@/services/nakama';
import { User } from '@/src/types/user';

export type GuestAuthResult = {
  user: User;
  session: Session | null;
};

const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

const isLocalhostRuntime = (): boolean => {
  if (typeof window === 'undefined' || !window.location) {
    return false;
  }

  return LOCALHOST_HOSTNAMES.has(window.location.hostname);
};

const shouldUseLocalGuestAuth = (): boolean =>
  getTransportMode() === 'offline' || isLocalhostRuntime();

const createLocalGuestResult = async (guestIdSuffix: string): Promise<GuestAuthResult> => {
  await nakamaService.clearSession();

  return {
    user: {
      id: `guest_local_${guestIdSuffix}`,
      username: 'Guest',
      email: null,
      avatarUrl: null,
      provider: 'guest',
      createdAt: new Date().toISOString(),
    },
    session: null,
  };
};

export const loginAsGuest = async (): Promise<GuestAuthResult> => {
  const guestIdSuffix = Crypto.randomUUID();

  try {
    if (shouldUseLocalGuestAuth()) {
      return createLocalGuestResult(guestIdSuffix);
    }

    const deviceId = `guest_${guestIdSuffix}`;
    const session = await nakamaService.authenticateDevice(deviceId, true, 'Guest');
    const account = await nakamaService.getAccount();

    return {
      user: {
        id: `guest_${account.user?.id || guestIdSuffix}`,
        username: account.user?.username || 'Guest',
        email: account.email || null,
        avatarUrl: account.user?.avatar_url || null,
        provider: 'guest',
        createdAt: new Date().toISOString(),
        nakamaUserId: account.user?.id,
      },
      session,
    };
  } catch (error) {
    throw new Error(`Guest login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

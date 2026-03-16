import * as Crypto from 'expo-crypto';
import { Session } from '@heroiclabs/nakama-js';

import { nakamaService } from '@/services/nakama';
import { User } from '@/src/types/user';

export type GuestAuthResult = {
  user: User;
  session: Session;
};

export const loginAsGuest = async (): Promise<GuestAuthResult> => {
  try {
    const deviceId = `guest_${Crypto.randomUUID()}`;
    const session = await nakamaService.authenticateDevice(deviceId, true);

    const account = await nakamaService.getAccount();

    const user: User = {
      id: `guest_${account.user?.id || Crypto.randomUUID()}`,
      username: account.user?.username || 'Guest',
      email: account.email || null,
      avatarUrl: account.user?.avatar_url || null,
      provider: 'guest',
      createdAt: new Date().toISOString(),
      nakamaUserId: account.user?.id,
    };

    return { user, session };
  } catch (error) {
    throw new Error(`Guest login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

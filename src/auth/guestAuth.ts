import * as Crypto from 'expo-crypto';

import { User } from '@/src/types/user';

export const createGuestUser = (): User => ({
  id: `guest_${Crypto.randomUUID()}`,
  username: 'Guest',
  email: null,
  avatarUrl: null,
  provider: 'guest',
  createdAt: new Date().toISOString(),
});

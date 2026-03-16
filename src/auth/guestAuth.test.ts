import * as Crypto from 'expo-crypto';
import { Session } from '@heroiclabs/nakama-js';

import { nakamaService } from '@/services/nakama';

import { loginAsGuest } from './guestAuth';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));

jest.mock('@/services/nakama', () => ({
  nakamaService: {
    authenticateDevice: jest.fn(),
    getAccount: jest.fn(),
  },
}));

const mockedCrypto = Crypto as jest.Mocked<typeof Crypto>;
const mockedNakamaService = nakamaService as jest.Mocked<typeof nakamaService>;

describe('loginAsGuest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a guest identity with Nakama authentication', async () => {
    mockedCrypto.randomUUID.mockReturnValue('abc123');

    const mockSession = {
      token: 'mock-token',
      refresh_token: 'mock-refresh-token',
    } as Session;

    const mockAccount = {
      user: {
        id: 'nakama-user-123',
        username: 'Guest',
        email: '',
        avatar_url: '',
      },
    };

    mockedNakamaService.authenticateDevice.mockResolvedValue(mockSession);
    mockedNakamaService.getAccount.mockResolvedValue(mockAccount);

    const result = await loginAsGuest();

    expect(mockedNakamaService.authenticateDevice).toHaveBeenCalledWith('guest_abc123', true, 'Guest');
    expect(result.user).toMatchObject({
      id: 'guest_nakama-user-123',
      username: 'Guest',
      email: null,
      avatarUrl: null,
      provider: 'guest',
      nakamaUserId: 'nakama-user-123',
    });
    expect(result.session).toBe(mockSession);
    expect(Date.parse(result.user.createdAt)).not.toBeNaN();
  });

  it('throws error when authentication fails', async () => {
    mockedCrypto.randomUUID.mockReturnValue('abc123');
    mockedNakamaService.authenticateDevice.mockRejectedValue(new Error('Network error'));

    await expect(loginAsGuest()).rejects.toThrow('Guest login failed: Network error');
  });
});

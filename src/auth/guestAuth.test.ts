import * as Crypto from 'expo-crypto';
import { Session } from '@heroiclabs/nakama-js';

import { getTransportMode } from '@/config/nakama';
import { nakamaService } from '@/services/nakama';

import { loginAsGuest } from './guestAuth';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));

jest.mock('@/config/nakama', () => ({
  getTransportMode: jest.fn(),
}));

jest.mock('@/services/nakama', () => ({
  nakamaService: {
    authenticateDevice: jest.fn(),
    clearSession: jest.fn(),
    getAccount: jest.fn(),
  },
}));

const mockedCrypto = Crypto as jest.Mocked<typeof Crypto>;
const mockedGetTransportMode = getTransportMode as jest.MockedFunction<typeof getTransportMode>;
const mockedNakamaService = nakamaService as jest.Mocked<typeof nakamaService>;
const originalWindow = global.window;

describe('loginAsGuest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetTransportMode.mockReturnValue('nakama');
    (global as { window?: Window }).window = originalWindow;
  });

  afterAll(() => {
    (global as { window?: Window }).window = originalWindow;
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

  it('creates a local guest identity on localhost without contacting Nakama', async () => {
    mockedCrypto.randomUUID.mockReturnValue('local-guest-id');
    (global as { window?: Window }).window = {
      location: { hostname: 'localhost' },
    } as Window;

    const result = await loginAsGuest();

    expect(mockedNakamaService.clearSession).toHaveBeenCalledTimes(1);
    expect(mockedNakamaService.authenticateDevice).not.toHaveBeenCalled();
    expect(mockedNakamaService.getAccount).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      user: {
        id: 'guest_local_local-guest-id',
        username: 'Guest',
        email: null,
        avatarUrl: null,
        provider: 'guest',
      },
      session: null,
    });
    expect(Date.parse(result.user.createdAt)).not.toBeNaN();
  });

  it('throws error when authentication fails', async () => {
    mockedCrypto.randomUUID.mockReturnValue('abc123');
    mockedNakamaService.authenticateDevice.mockRejectedValue(new Error('Network error'));

    await expect(loginAsGuest()).rejects.toThrow('Guest login failed: Network error');
  });
});

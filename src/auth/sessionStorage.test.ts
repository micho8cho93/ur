import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { User } from '@/src/types/user';

import { clearSession, loadSession, saveSession } from './sessionStorage';

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const originalPlatform = Platform.OS;

const makeUser = (): User => ({
  id: 'user-1',
  username: 'Player One',
  email: 'player@example.com',
  avatarUrl: 'https://example.com/avatar.png',
  provider: 'google',
  createdAt: '2026-03-15T10:00:00.000Z',
});

const setPlatform = (platform: typeof Platform.OS) => {
  (Platform as { OS: typeof Platform.OS }).OS = platform;
};

const createLocalStorageMock = () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
});

describe('sessionStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (global as { window?: Window }).window;
    setPlatform(originalPlatform);
  });

  afterAll(() => {
    setPlatform(originalPlatform);
  });

  it('saves and loads sessions with SecureStore on native', async () => {
    const user = makeUser();
    setPlatform('ios');
    mockedSecureStore.getItemAsync.mockResolvedValue(
      JSON.stringify({
        version: 1,
        user,
        nakamaSessionToken: 'token-123',
        nakamaRefreshToken: 'refresh-123',
      })
    );

    await saveSession(user, 'token-123', 'refresh-123');
    const loaded = await loadSession();

    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
      'auth.session.v1',
      JSON.stringify({
        version: 1,
        user,
        nakamaSessionToken: 'token-123',
        nakamaRefreshToken: 'refresh-123',
      })
    );
    expect(loaded).toEqual({
      user,
      nakamaSessionToken: 'token-123',
      nakamaRefreshToken: 'refresh-123',
    });
  });

  it('uses localStorage on web', async () => {
    const user = makeUser();
    const localStorage = createLocalStorageMock();

    setPlatform('web');
    localStorage.getItem.mockReturnValue(
      JSON.stringify({
        version: 1,
        user,
        nakamaSessionToken: 'web-token',
        nakamaRefreshToken: 'web-refresh',
      })
    );
    (global as { window?: unknown }).window = {
      localStorage,
    };

    await saveSession(user, 'web-token', 'web-refresh');
    const loaded = await loadSession();
    await clearSession();

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'auth.session.v1',
      JSON.stringify({
        version: 1,
        user,
        nakamaSessionToken: 'web-token',
        nakamaRefreshToken: 'web-refresh',
      })
    );
    expect(loaded).toEqual({
      user,
      nakamaSessionToken: 'web-token',
      nakamaRefreshToken: 'web-refresh',
    });
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth.session.v1');
  });

  it('clears invalid stored payloads', async () => {
    setPlatform('android');
    mockedSecureStore.getItemAsync.mockResolvedValue('{invalid-json');

    await expect(loadSession()).resolves.toBeNull();

    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth.session.v1');
  });

  it('returns null when no session exists', async () => {
    setPlatform('android');
    mockedSecureStore.getItemAsync.mockResolvedValue(null);

    await expect(loadSession()).resolves.toBeNull();

    expect(mockedSecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });
});

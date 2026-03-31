import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@heroiclabs/nakama-js';

import { NakamaService } from './nakama';

const mockSessionRefresh = jest.fn();
const mockCreateSocket = jest.fn();
const mockAuthenticateDevice = jest.fn();
const mockLoadStoredUser = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../config/nakama', () => ({
  getNakamaConfig: () => ({
    host: 'localhost',
    port: '7350',
    serverKey: 'defaultkey',
    timeoutMs: 5_000,
    useSSL: false,
  }),
}));

jest.mock('@/src/auth/sessionStorage', () => ({
  loadStoredUser: (...args: unknown[]) => mockLoadStoredUser(...args),
}));

jest.mock('@heroiclabs/nakama-js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    authenticateDevice: (...args: unknown[]) => mockAuthenticateDevice(...args),
    createSocket: (...args: unknown[]) => mockCreateSocket(...args),
    sessionRefresh: (...args: unknown[]) => mockSessionRefresh(...args),
  })),
  Session: {
    restore: jest.fn(),
  },
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockedSessionRestore = Session.restore as jest.MockedFunction<typeof Session.restore>;

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe('NakamaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadStoredUser.mockResolvedValue(null);
    mockCreateSocket.mockReturnValue({
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
  });

  it('refreshes an expired in-memory session before returning it', async () => {
    const service = new NakamaService();
    const expiredSession = {
      token: 'expired-token',
      refresh_token: 'expired-refresh',
      isexpired: jest.fn(() => true),
    } as never;
    const refreshedSession = {
      token: 'fresh-token',
      refresh_token: 'fresh-refresh',
      isexpired: jest.fn(() => false),
    } as never;

    (service as unknown as { session: unknown }).session = expiredSession;
    mockSessionRefresh.mockResolvedValue(refreshedSession);

    await expect(service.loadSession()).resolves.toBe(refreshedSession);
    expect(mockSessionRefresh).toHaveBeenCalledWith(expiredSession);
    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      'nakama.session',
      JSON.stringify({
        token: 'fresh-token',
        refreshToken: 'fresh-refresh',
      }),
    );
  });

  it('deduplicates concurrent session refreshes against the same expired session', async () => {
    const service = new NakamaService();
    const expiredSession = {
      token: 'expired-token',
      refresh_token: 'expired-refresh',
      isexpired: jest.fn(() => true),
    } as never;
    const refreshedSession = {
      token: 'fresh-token',
      refresh_token: 'fresh-refresh',
      isexpired: jest.fn(() => false),
    } as never;
    const deferredRefresh = createDeferred<typeof refreshedSession>();

    (service as unknown as { session: unknown }).session = expiredSession;
    mockSessionRefresh.mockReturnValue(deferredRefresh.promise);

    const firstLoad = service.loadSession();
    const secondLoad = service.loadSession();

    expect(mockSessionRefresh).toHaveBeenCalledTimes(1);

    deferredRefresh.resolve(refreshedSession);

    await expect(firstLoad).resolves.toBe(refreshedSession);
    await expect(secondLoad).resolves.toBe(refreshedSession);
    expect(mockedAsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it('clears an expired in-memory session when refresh is unauthorized', async () => {
    const service = new NakamaService();
    const disconnect = jest.fn();
    const expiredSession = {
      token: 'expired-token',
      refresh_token: 'expired-refresh',
      isexpired: jest.fn(() => true),
    } as never;

    (service as unknown as { session: unknown; socket: unknown }).session = expiredSession;
    (service as unknown as { session: unknown; socket: unknown }).socket = { disconnect };
    mockSessionRefresh.mockRejectedValue({
      message: 'Unauthorized',
      status: 401,
    });

    await expect(service.loadSession()).resolves.toBeNull();
    expect(mockSessionRefresh).toHaveBeenCalledWith(expiredSession);
    expect(disconnect).toHaveBeenCalledWith(true);
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('nakama.session');
    expect(service.getSession()).toBeNull();
  });

  it('clears an expired stored session when refresh is unauthorized', async () => {
    const service = new NakamaService();
    const restoredSession = {
      token: 'stored-token',
      refresh_token: 'stored-refresh',
      isexpired: jest.fn(() => true),
    } as never;

    mockedAsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        token: 'stored-token',
        refreshToken: 'stored-refresh',
      }),
    );
    mockedSessionRestore.mockReturnValue(restoredSession);
    mockSessionRefresh.mockRejectedValue({
      message: 'Unauthorized',
      status: 401,
    });

    await expect(service.loadSession()).resolves.toBeNull();
    expect(mockedSessionRestore).toHaveBeenCalledWith('stored-token', 'stored-refresh');
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('nakama.session');
    expect(service.getSession()).toBeNull();
  });

  it('does not fall back to device auth for a stored Google account', async () => {
    const service = new NakamaService();

    mockedAsyncStorage.getItem.mockResolvedValue(null);
    mockLoadStoredUser.mockResolvedValue({
      id: 'google-user',
      username: 'RoyalMichel',
      email: 'royal@example.com',
      avatarUrl: null,
      provider: 'google',
      createdAt: '2026-03-29T12:00:00.000Z',
    });

    await expect(service.ensureAuthenticatedDevice()).rejects.toThrow(
      'Your Google multiplayer session expired. Please sign in again.',
    );
    expect(mockAuthenticateDevice).not.toHaveBeenCalled();
  });

  it('prevents unauthorized recovery from silently downgrading a Google account to device auth', async () => {
    const service = new NakamaService();

    mockLoadStoredUser.mockResolvedValue({
      id: 'google-user',
      username: 'RoyalMichel',
      email: 'royal@example.com',
      avatarUrl: null,
      provider: 'google',
      createdAt: '2026-03-29T12:00:00.000Z',
    });

    await expect(service.recoverSessionAfterUnauthorized(null)).resolves.toBeNull();
    expect(mockAuthenticateDevice).not.toHaveBeenCalled();
  });
});

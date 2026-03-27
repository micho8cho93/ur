import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@heroiclabs/nakama-js';

import { NakamaService } from './nakama';

const mockSessionRefresh = jest.fn();
const mockCreateSocket = jest.fn();

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

jest.mock('@heroiclabs/nakama-js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    createSocket: (...args: unknown[]) => mockCreateSocket(...args),
    sessionRefresh: (...args: unknown[]) => mockSessionRefresh(...args),
  })),
  Session: {
    restore: jest.fn(),
  },
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockedSessionRestore = Session.restore as jest.MockedFunction<typeof Session.restore>;

describe('NakamaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});

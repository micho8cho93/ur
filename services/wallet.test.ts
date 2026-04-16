import { PREMIUM_CURRENCY_KEY, SOFT_CURRENCY_KEY } from '../shared/wallet';
import { getWallet } from './wallet';
import { nakamaService } from './nakama';

jest.mock('./nakama', () => ({
  nakamaService: {
    loadSession: jest.fn(),
    getClient: jest.fn(),
  },
}));

const mockedNakamaService = nakamaService as jest.Mocked<typeof nakamaService>;

describe('wallet service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNakamaService.loadSession.mockResolvedValue({ token: 'session' } as never);
  });

  it('returns a valid wallet response from the get_wallet RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({
      payload: JSON.stringify({
        wallet: { [SOFT_CURRENCY_KEY]: 25, [PREMIUM_CURRENCY_KEY]: 7 },
        softCurrency: 25,
        premiumCurrency: 7,
      }),
    });
    mockedNakamaService.getClient.mockReturnValue({ rpc } as never);

    await expect(getWallet()).resolves.toEqual({
      wallet: { [SOFT_CURRENCY_KEY]: 25, [PREMIUM_CURRENCY_KEY]: 7 },
      softCurrency: 25,
      premiumCurrency: 7,
    });
    expect(rpc).toHaveBeenCalledWith({ token: 'session' }, 'get_wallet', {});
  });

  it('rejects malformed wallet RPC payloads', async () => {
    const rpc = jest.fn().mockResolvedValue({
      payload: JSON.stringify({
        wallet: { [SOFT_CURRENCY_KEY]: 25, [PREMIUM_CURRENCY_KEY]: 0 },
        softCurrency: 24,
        premiumCurrency: 0,
      }),
    });
    mockedNakamaService.getClient.mockReturnValue({ rpc } as never);

    await expect(getWallet()).rejects.toThrow('Wallet RPC payload is invalid.');
  });

  it('requires an active Nakama session', async () => {
    mockedNakamaService.loadSession.mockResolvedValue(null);

    await expect(getWallet()).rejects.toThrow('No active Nakama session.');
  });
});

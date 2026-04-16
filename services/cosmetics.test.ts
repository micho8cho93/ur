import { PREMIUM_CURRENCY_KEY, SOFT_CURRENCY_KEY } from '../shared/wallet';
import { getFullCatalog, getOwnedCosmetics, getStorefront, purchaseItem } from './cosmetics';
import { nakamaService } from './nakama';

jest.mock('./nakama', () => ({
  nakamaService: {
    loadSession: jest.fn(),
    getClient: jest.fn(),
  },
}));

const mockedNakamaService = nakamaService as jest.Mocked<typeof nakamaService>;

const cosmetic = {
  id: 'board_cedar_001',
  name: 'Cedar Court Board',
  tier: 'common',
  type: 'board',
  price: { currency: 'soft', amount: 300 },
  rotationPools: ['daily'],
  rarityWeight: 0.9,
  releasedDate: '2026-04-15T00:00:00.000Z',
  assetKey: 'board_cedar_001',
};

describe('cosmetics service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNakamaService.loadSession.mockResolvedValue({ token: 'session' } as never);
  });

  it('loads and validates the storefront RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({
      payload: JSON.stringify({
        dailyRotation: [cosmetic],
        featured: [],
        limitedTime: [],
        bundles: [],
        ownedIds: [],
        rotationExpiresAt: '2026-04-16T00:00:00.000Z',
      }),
    });
    mockedNakamaService.getClient.mockReturnValue({ rpc } as never);

    await expect(getStorefront()).resolves.toEqual(
      expect.objectContaining({
        dailyRotation: [cosmetic],
      }),
    );
    expect(rpc).toHaveBeenCalledWith({ token: 'session' }, 'get_storefront', {});
  });

  it('loads and validates purchase responses', async () => {
    const rpc = jest.fn().mockResolvedValue({
      payload: JSON.stringify({
        success: true,
        cosmeticId: 'board_cedar_001',
        updatedWallet: {
          [SOFT_CURRENCY_KEY]: 700,
          [PREMIUM_CURRENCY_KEY]: 0,
        },
      }),
    });
    mockedNakamaService.getClient.mockReturnValue({ rpc } as never);

    await expect(purchaseItem('board_cedar_001')).resolves.toEqual(
      expect.objectContaining({
        success: true,
        cosmeticId: 'board_cedar_001',
      }),
    );
    expect(rpc).toHaveBeenCalledWith({ token: 'session' }, 'purchase_item', { itemId: 'board_cedar_001' });
  });

  it('loads and validates the full catalog RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({
      payload: JSON.stringify({
        items: [cosmetic],
      }),
    });
    mockedNakamaService.getClient.mockReturnValue({ rpc } as never);

    await expect(getFullCatalog()).resolves.toEqual({ items: [cosmetic] });
    expect(rpc).toHaveBeenCalledWith({ token: 'session' }, 'get_full_catalog', {});
  });

  it('loads and validates owned cosmetics responses', async () => {
    const rpc = jest.fn().mockResolvedValue({
      payload: JSON.stringify({
        items: [
          {
            cosmeticId: 'board_cedar_001',
            acquiredAt: '2026-04-15T00:00:00.000Z',
            source: 'purchase_soft',
          },
        ],
        cosmeticIds: ['board_cedar_001'],
      }),
    });
    mockedNakamaService.getClient.mockReturnValue({ rpc } as never);

    await expect(getOwnedCosmetics()).resolves.toEqual(
      expect.objectContaining({
        cosmeticIds: ['board_cedar_001'],
      }),
    );
  });

  it('rejects malformed storefront payloads and missing sessions', async () => {
    mockedNakamaService.getClient.mockReturnValue({ rpc: jest.fn().mockResolvedValue({ payload: '{}' }) } as never);
    await expect(getStorefront()).rejects.toThrow('Storefront RPC payload is invalid.');

    mockedNakamaService.loadSession.mockResolvedValue(null);
    await expect(getStorefront()).rejects.toThrow('No active Nakama session.');
  });
});

const mockRpc = jest.fn();
const mockEnsureAuthenticatedDevice = jest.fn();

jest.mock('./nakama', () => ({
  nakamaService: {
    ensureAuthenticatedDevice: (...args: unknown[]) => mockEnsureAuthenticatedDevice(...args),
    getClient: () => ({
      rpc: (...args: unknown[]) => mockRpc(...args),
    }),
    connectSocketWithRetry: jest.fn(),
    getSocket: jest.fn(),
    disconnectSocket: jest.fn(),
  },
}));

import { createPrivateMatch, getPrivateMatchStatus, joinPrivateMatch } from './matchmaking';

describe('matchmaking private RPC parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureAuthenticatedDevice.mockResolvedValue({
      user_id: 'user-1',
      token: 'token',
      refresh_token: 'refresh',
    });
  });

  it('parses create-private payloads returned as JSON strings', async () => {
    mockRpc.mockResolvedValue({
      payload: JSON.stringify({
        matchId: 'match-1',
        modeId: 'standard',
        code: 'EJ544DTQ',
      }),
    });

    await expect(createPrivateMatch('standard')).resolves.toEqual(
      expect.objectContaining({
        matchId: 'match-1',
        modeId: 'standard',
        code: 'EJ544DTQ',
        userId: 'user-1',
      })
    );
  });

  it('parses join/status payloads returned as JSON strings', async () => {
    mockRpc
      .mockResolvedValueOnce({
        payload: JSON.stringify({
          matchId: 'match-2',
          modeId: 'gameMode_3_pieces',
          code: 'ABCD2345',
        }),
      })
      .mockResolvedValueOnce({
        payload: JSON.stringify({
          matchId: 'match-2',
          modeId: 'gameMode_3_pieces',
          code: 'ABCD2345',
          hasGuestJoined: true,
        }),
      });

    await expect(joinPrivateMatch('abcd2345')).resolves.toEqual(
      expect.objectContaining({
        matchId: 'match-2',
        modeId: 'gameMode_3_pieces',
        code: 'ABCD2345',
      })
    );

    await expect(getPrivateMatchStatus('abcd2345')).resolves.toEqual({
      matchId: 'match-2',
      modeId: 'gameMode_3_pieces',
      code: 'ABCD2345',
      hasGuestJoined: true,
    });
  });

  it('accepts privateCode aliases when the backend omits code', async () => {
    mockRpc
      .mockResolvedValueOnce({
        payload: {
          matchId: 'match-3',
          modeId: 'standard',
          privateCode: 'ZXCV2345',
        },
      })
      .mockResolvedValueOnce({
        payload: JSON.stringify({
          match_id: 'match-3',
          mode_id: 'standard',
          private_code: 'ZXCV2345',
          has_guest_joined: false,
        }),
      });

    await expect(createPrivateMatch('standard')).resolves.toEqual(
      expect.objectContaining({
        matchId: 'match-3',
        modeId: 'standard',
        code: 'ZXCV2345',
      })
    );

    await expect(getPrivateMatchStatus('zxcv2345')).resolves.toEqual({
      matchId: 'match-3',
      modeId: 'standard',
      code: 'ZXCV2345',
      hasGuestJoined: false,
    });
  });
});

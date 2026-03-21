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
});

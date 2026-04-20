import {
  createOpenOnlineMatch,
  createPrivateMatch,
  findMatch,
  getActiveOpenOnlineMatch,
  getOpenOnlineMatchStatus,
  getPrivateMatchStatus,
  joinOpenOnlineMatch,
  joinPrivateMatch,
  listOpenOnlineMatches,
  listSpectatableMatches,
} from './matchmaking';

const mockRpc = jest.fn();
const mockEnsureAuthenticatedDevice = jest.fn();
const mockConnectSocketWithRetry = jest.fn();
const mockDisconnectSocket = jest.fn();
const mockGetSocket = jest.fn();

jest.mock('./nakama', () => ({
  nakamaService: {
    ensureAuthenticatedDevice: (...args: unknown[]) => mockEnsureAuthenticatedDevice(...args),
    getClient: () => ({
      rpc: (...args: unknown[]) => mockRpc(...args),
    }),
    connectSocketWithRetry: (...args: unknown[]) => mockConnectSocketWithRetry(...args),
    getSocket: (...args: unknown[]) => mockGetSocket(...args),
    disconnectSocket: (...args: unknown[]) => mockDisconnectSocket(...args),
  },
}));

describe('matchmaking private RPC parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureAuthenticatedDevice.mockResolvedValue({
      user_id: 'user-1',
      token: 'token',
      refresh_token: 'refresh',
    });
  });

  it('waits for a matchmaker result and lets the match screen perform the actual join', async () => {
    const socket = {
      addMatchmaker: jest.fn().mockResolvedValue({ ticket: 'ticket-1' }),
      joinMatch: jest.fn(),
      onmatchmakermatched: null as ((payload: { ticket: string; match_id: string; token?: string }) => void) | null,
    };
    const onSearching = jest.fn();

    mockConnectSocketWithRetry.mockResolvedValue(socket);

    const resultPromise = findMatch({ onSearching });

    await new Promise((resolve) => setImmediate(resolve));

    expect(socket.addMatchmaker).toHaveBeenCalledWith('*', 2, 2);
    expect(onSearching).toHaveBeenCalledTimes(1);

    socket.onmatchmakermatched?.({
      ticket: 'ticket-1',
      match_id: 'match-public-1',
      token: 'join-token-1',
    });

    await expect(resultPromise).resolves.toEqual({
      matchId: 'match-public-1',
      session: expect.objectContaining({ user_id: 'user-1' }),
      userId: 'user-1',
      matchmakerTicket: 'ticket-1',
      playerColor: null,
      matchToken: 'join-token-1',
    });
    expect(socket.joinMatch).not.toHaveBeenCalled();
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

  it('surfaces backend rpc messages instead of flattening them to a generic status code', async () => {
    mockRpc.mockRejectedValue({
      status: 500,
      statusText: 'Internal Server Error',
      message: 'Private game code not found.',
    });

    await expect(joinPrivateMatch('ABCD2345')).rejects.toThrow('Private game code not found.');
  });

  it('reads backend rpc messages from response-style errors', async () => {
    mockRpc.mockRejectedValue({
      status: 500,
      statusText: 'Internal Server Error',
      clone: () => ({
        text: async () => JSON.stringify({ message: 'Authoritative match handler failed to start.' }),
      }),
    });

    await expect(createPrivateMatch('gameMode_finkel_rules')).rejects.toThrow(
      'Authoritative match handler failed to start.',
    );
  });

  it('parses spectatable match payloads and filters invalid entries', async () => {
    mockRpc.mockResolvedValue({
      payload: JSON.stringify({
        matches: [
          {
            matchId: 'match-live-1',
            modeId: 'standard',
            displayName: 'Quick Play',
            startedAt: '2026-04-12T10:00:00.000Z',
            playerLabels: ['Light Player', 'Dark Player'],
          },
          {
            match_id: 'match-live-2',
            mode_id: 'gameMode_3_pieces',
            display_name: 'Race',
            started_at: '2026-04-12T10:01:00.000Z',
            player_labels: ['A', 'B', 'ignored'],
          },
          {
            matchId: 'broken-mode',
            modeId: '',
            playerLabels: ['A', 'B'],
          },
          {
            modeId: 'standard',
            playerLabels: ['missing match id'],
          },
        ],
      }),
    });

    await expect(listSpectatableMatches()).resolves.toEqual([
      {
        matchId: 'match-live-1',
        modeId: 'standard',
        displayName: 'Quick Play',
        startedAt: '2026-04-12T10:00:00.000Z',
        playerLabels: ['Light Player', 'Dark Player'],
      },
      {
        matchId: 'match-live-2',
        modeId: 'gameMode_3_pieces',
        displayName: 'Race',
        startedAt: '2026-04-12T10:01:00.000Z',
        playerLabels: ['A', 'B'],
      },
    ]);
    expect(mockRpc).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1' }),
      'list_spectatable_matches',
      {},
    );
  });

  it('rejects invalid spectatable match payload containers', async () => {
    mockRpc.mockResolvedValue({
      payload: JSON.stringify({ liveMatches: [] }),
    });

    await expect(listSpectatableMatches()).rejects.toThrow('Live matches returned an invalid payload.');
  });

  it('creates, lists, joins, and reads open online matches', async () => {
    const matchPayload = {
      openMatchId: 'open-1',
      matchId: 'match-open-1',
      modeId: 'standard',
      creatorUserId: 'creator-1',
      joinedUserId: null,
      wager: 30,
      durationMinutes: 5,
      status: 'open',
      createdAt: '2026-04-18T10:00:00.000Z',
      expiresAt: '2026-04-18T10:05:00.000Z',
      updatedAt: '2026-04-18T10:00:00.000Z',
      entrants: 1,
      maxEntrants: 2,
      isCreator: true,
      isJoiner: false,
    };

    mockRpc
      .mockResolvedValueOnce({ payload: JSON.stringify({ match: matchPayload }) })
      .mockResolvedValueOnce({ payload: JSON.stringify({ matches: [matchPayload] }) })
      .mockResolvedValueOnce({
        payload: JSON.stringify({
          match: {
            ...matchPayload,
            joinedUserId: 'joiner-1',
            status: 'matched',
            entrants: 2,
            isCreator: false,
            isJoiner: true,
          },
        }),
      })
      .mockResolvedValueOnce({ payload: JSON.stringify({ match: matchPayload }) })
      .mockResolvedValueOnce({ payload: JSON.stringify({ match: null }) });

    await expect(createOpenOnlineMatch(30, 5, 'gameMode_3_pieces')).resolves.toEqual({
      match: expect.objectContaining({
        openMatchId: 'open-1',
        wager: 30,
        status: 'open',
      }),
      session: expect.objectContaining({ user_id: 'user-1' }),
      userId: 'user-1',
    });
    expect(mockRpc).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ user_id: 'user-1' }),
      'create_open_online_match',
      { wager: 30, durationMinutes: 5, modeId: 'gameMode_3_pieces' },
    );

    await expect(listOpenOnlineMatches()).resolves.toEqual([
      expect.objectContaining({ openMatchId: 'open-1', entrants: 1 }),
    ]);
    await expect(joinOpenOnlineMatch('open-1')).resolves.toEqual({
      match: expect.objectContaining({ openMatchId: 'open-1', status: 'matched', entrants: 2 }),
      session: expect.objectContaining({ user_id: 'user-1' }),
      userId: 'user-1',
    });
    await expect(getOpenOnlineMatchStatus('open-1')).resolves.toEqual(
      expect.objectContaining({ openMatchId: 'open-1' }),
    );
    await expect(getActiveOpenOnlineMatch()).resolves.toBeNull();
  });

  it('rejects malformed open online match payloads', async () => {
    mockRpc.mockResolvedValue({
      payload: JSON.stringify({ match: { openMatchId: 'open-1' } }),
    });

    await expect(createOpenOnlineMatch(20, 5, 'gameMode_3_pieces')).rejects.toThrow('Open online match returned an invalid payload.');
  });
});

import './index';

type RuntimeGlobals = typeof globalThis & {
  rpcCreatePrivateMatch: (
    ctx: { userId?: string | null },
    logger: { info: jest.Mock; warn: jest.Mock; error?: jest.Mock },
    nk: {
      storageRead: jest.Mock;
      storageWrite: jest.Mock;
      matchCreate: jest.Mock;
    },
    payload: string
  ) => string;
  matchInit: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; error?: jest.Mock },
    nk: {
      storageRead: jest.Mock;
      storageWrite: jest.Mock;
      matchCreate: jest.Mock;
    },
    params: Record<string, unknown>
  ) => { state: Record<string, unknown>; tickRate: number; label: string };
  rpcJoinPrivateMatch: (
    ctx: { userId?: string | null },
    logger: { info: jest.Mock; warn: jest.Mock; error?: jest.Mock },
    nk: {
      storageRead: jest.Mock;
      storageWrite: jest.Mock;
      matchCreate: jest.Mock;
      matchLeave?: jest.Mock;
    },
    payload: string
  ) => string;
  matchLeave: (
    ctx: { matchId?: string | null; match_id?: string | null },
    logger: { info: jest.Mock; warn: jest.Mock; error?: jest.Mock },
    nk: {
      storageRead: jest.Mock;
      storageWrite: jest.Mock;
      matchCreate: jest.Mock;
    },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: Record<string, unknown>,
    presences: Array<{ user_id: string; session_id: string }>
  ) => { state: Record<string, unknown> };
};

describe('private match RPC payloads', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns both code and privateCode when creating a private match', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const runtime = globalThis as RuntimeGlobals;
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const nk = {
      storageRead: jest.fn(() => []),
      storageWrite: jest.fn(),
      matchCreate: jest.fn(() => 'match-1'),
    };

    const response = runtime.rpcCreatePrivateMatch(
      { userId: 'user-1' },
      logger,
      nk,
      JSON.stringify({ modeId: 'standard' })
    );

    expect(JSON.parse(response)).toEqual({
      matchId: 'match-1',
      modeId: 'standard',
      code: 'AAAAAAAA',
      privateCode: 'AAAAAAAA',
    });
    expect(nk.storageWrite).toHaveBeenCalledWith([
      expect.objectContaining({
        collection: 'private_match_codes',
        key: 'AAAAAAAA',
        userId: '00000000-0000-0000-0000-000000000000',
      }),
    ]);
  });

  it('can initialize the authoritative private match when matchCreate invokes matchInit immediately', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const runtime = globalThis as RuntimeGlobals;
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const storage = new Map<string, { collection: string; key: string; userId: string; version: string; value: unknown }>();
    const nk = {
      storageRead: jest.fn((requests: { collection: string; key: string; userId?: string }[]) =>
        requests
          .map((request) => storage.get(`${request.collection}:${request.key}:${request.userId ?? ''}`))
          .filter(Boolean),
      ),
      storageWrite: jest.fn((writes: { collection: string; key: string; value: unknown; userId?: string }[]) => {
        writes.forEach((write, index) => {
          const userId = write.userId ?? '00000000-0000-0000-0000-000000000000';
          storage.set(`${write.collection}:${write.key}:${userId}`, {
            collection: write.collection,
            key: write.key,
            userId,
            version: `version-${storage.size + index + 1}`,
            value: write.value,
          });
        });
      }),
      matchCreate: jest.fn((handlerName: string, params: Record<string, unknown>) => {
        expect(handlerName).toBe('authoritative_match');
        const initialized = runtime.matchInit({ matchId: 'match-1' }, logger, nk, params);
        expect(initialized.label).toBe('authoritative_match');
        expect(initialized.state).toEqual(
          expect.objectContaining({
            modeId: 'gameMode_3_pieces',
            privateMatch: true,
          }),
        );
        return 'match-1';
      }),
    };

    const response = runtime.rpcCreatePrivateMatch(
      { userId: 'host-1' },
      logger,
      nk,
      JSON.stringify({ modeId: 'gameMode_3_pieces' }),
    );

    expect(JSON.parse(response)).toEqual(
      expect.objectContaining({
        matchId: 'match-1',
        modeId: 'gameMode_3_pieces',
        code: 'AAAAAAAA',
      }),
    );
  });

  it('marks standard private tables as rated and alternate private tables as unrated', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const runtime = globalThis as RuntimeGlobals;
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const nk = {
      storageRead: jest.fn(() => []),
      storageWrite: jest.fn(),
      matchCreate: jest.fn(() => 'match-1'),
    };

    runtime.rpcCreatePrivateMatch(
      { userId: 'user-1' },
      logger,
      nk,
      JSON.stringify({ modeId: 'standard' })
    );
    runtime.rpcCreatePrivateMatch(
      { userId: 'user-1' },
      logger,
      nk,
      JSON.stringify({ modeId: 'gameMode_3_pieces' })
    );

    expect(nk.matchCreate).toHaveBeenNthCalledWith(
      1,
      'authoritative_match',
      expect.objectContaining({
        modeId: 'standard',
        privateMatch: true,
        rankedMatch: true,
        winRewardSource: 'private_pvp_win',
        allowsChallengeRewards: true,
      })
    );
    expect(nk.matchCreate).toHaveBeenNthCalledWith(
      2,
      'authoritative_match',
      expect.objectContaining({
        modeId: 'gameMode_3_pieces',
        privateMatch: true,
        rankedMatch: false,
        winRewardSource: 'private_pvp_win',
        allowsChallengeRewards: true,
      })
    );
  });

  it('reads and claims private codes from system-owned storage', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const storage = new Map<string, { collection: string; key: string; userId: string; version: string; value: unknown }>();
    const nk = {
      storageRead: jest.fn((requests: { collection: string; key: string; userId?: string }[]) =>
        requests
          .map((request) => storage.get(`${request.collection}:${request.key}:${request.userId ?? ''}`))
          .filter(Boolean),
      ),
      storageWrite: jest.fn((writes: { collection: string; key: string; value: unknown; userId?: string }[]) => {
        writes.forEach((write, index) => {
          const userId = write.userId ?? '00000000-0000-0000-0000-000000000000';
          storage.set(`${write.collection}:${write.key}:${userId}`, {
            collection: write.collection,
            key: write.key,
            userId,
            version: `version-${storage.size + index + 1}`,
            value: write.value,
          });
        });
      }),
      matchCreate: jest.fn(() => 'match-1'),
    };

    const created = JSON.parse(
      runtime.rpcCreatePrivateMatch(
        { userId: 'creator-1' },
        logger,
        nk,
        JSON.stringify({ modeId: 'standard' })
      )
    ) as { code: string; matchId: string; modeId: string };

    const response = runtime.rpcJoinPrivateMatch(
      { userId: 'guest-1' },
      logger,
      nk,
      JSON.stringify({ code: created.code })
    );

    expect(nk.storageRead).toHaveBeenCalledWith([
      {
        collection: 'private_match_codes',
        key: created.code,
        userId: '00000000-0000-0000-0000-000000000000',
      },
      {
        collection: 'private_match_codes',
        key: created.code,
      },
    ]);
    expect(nk.storageWrite).toHaveBeenNthCalledWith(3, [
      expect.objectContaining({
        collection: 'private_match_codes',
        key: created.code,
        userId: '00000000-0000-0000-0000-000000000000',
        version: 'version-2',
        value: expect.objectContaining({
          code: created.code,
          creatorUserId: 'creator-1',
          joinedUserId: 'guest-1',
          matchId: 'match-1',
          modeId: 'standard',
        }),
      }),
    ]);
    expect(JSON.parse(response)).toEqual(expect.objectContaining(created));
  });

  it('retries reservation collisions before creating the private match', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const nk = {
      storageRead: jest.fn(() => []),
      storageWrite: jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('Storage write rejected - version check failed.');
        })
        .mockImplementation(() => undefined),
      matchCreate: jest.fn(() => 'match-1'),
    };

    const response = runtime.rpcCreatePrivateMatch(
      { userId: 'user-1' },
      logger,
      nk,
      JSON.stringify({ modeId: 'standard' }),
    );

    expect(JSON.parse(response)).toEqual(
      expect.objectContaining({
        matchId: 'match-1',
        modeId: 'standard',
      }),
    );
    expect(nk.storageWrite).toHaveBeenCalledTimes(3);
    expect(nk.matchCreate).toHaveBeenCalledTimes(1);
  });

  it('returns a clear error when publishing the reserved code fails after match creation', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const nk = {
      storageRead: jest.fn(() => []),
      storageWrite: jest
        .fn()
        .mockImplementationOnce(() => undefined)
        .mockImplementation(() => {
          throw new Error('temporary storage outage');
        }),
      matchCreate: jest.fn(() => 'match-1'),
    };

    expect(() =>
      runtime.rpcCreatePrivateMatch(
        { userId: 'user-1' },
        logger,
        nk,
        JSON.stringify({ modeId: 'standard' }),
      ),
    ).toThrow('Private table was created but could not be published. Please create a new private table.');
    expect(nk.matchCreate).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('clears the private guest reservation when the guest leaves before the match starts', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const storage = new Map<string, { collection: string; key: string; userId: string; version: string; value: unknown }>();
    const nk = {
      storageRead: jest.fn((requests: { collection: string; key: string; userId?: string }[]) =>
        requests
          .map((request) => storage.get(`${request.collection}:${request.key}:${request.userId ?? ''}`))
          .filter(Boolean),
      ),
      storageWrite: jest.fn((writes: { collection: string; key: string; value: unknown; userId?: string }[]) => {
        writes.forEach((write, index) => {
          const userId = write.userId ?? '00000000-0000-0000-0000-000000000000';
          storage.set(`${write.collection}:${write.key}:${userId}`, {
            collection: write.collection,
            key: write.key,
            userId,
            version: `version-${storage.size + index + 1}`,
            value: write.value,
          });
        });
      }),
      matchCreate: jest.fn(() => 'match-1'),
    };

    const created = JSON.parse(
      runtime.rpcCreatePrivateMatch(
        { userId: 'creator-1' },
        logger,
        nk,
        JSON.stringify({ modeId: 'standard' }),
      ),
    ) as { code: string; matchId: string; modeId: string };

    runtime.rpcJoinPrivateMatch(
      { userId: 'guest-1' },
      logger,
      nk,
      JSON.stringify({ code: created.code }),
    );

    const initialized = runtime.matchInit(
      { matchId: 'match-1' },
      logger,
      nk,
      {
        playerIds: ['creator-1', 'guest-1'],
        modeId: 'standard',
        privateMatch: true,
        privateCode: created.code,
        privateCreatorUserId: 'creator-1',
        privateGuestUserId: 'guest-1',
        rankedMatch: true,
        casualMatch: false,
        botMatch: false,
        winRewardSource: 'private_pvp_win',
        allowsChallengeRewards: true,
      },
    );

    const state = initialized.state as {
      privateMatch: boolean;
      privateCode: string | null;
      privateCreatorUserId: string | null;
      privateGuestUserId: string | null;
      started: boolean;
      revision: number;
      presences: Record<string, Record<string, { user_id: string; session_id: string }>>;
      assignments: Record<string, string>;
      gameState: { winner: string | null; phase: string };
    };

    state.started = false;
    state.gameState.winner = null;
    state.gameState.phase = 'rolling';
    state.presences = {
      'guest-1': {
        'sess-1': {
          user_id: 'guest-1',
          session_id: 'sess-1',
        },
      },
    };
    state.assignments = {
      'creator-1': 'light',
      'guest-1': 'dark',
    };
    state.privateMatch = true;
    state.privateCode = created.code;
    state.privateCreatorUserId = 'creator-1';
    state.privateGuestUserId = 'guest-1';
    state.revision = 0;

    const dispatcher = {
      broadcastMessage: jest.fn(),
    };

    runtime.matchLeave(
      { matchId: 'match-1' },
      logger,
      nk,
      dispatcher,
      0,
      state as unknown as Record<string, unknown>,
      [{ user_id: 'guest-1', session_id: 'sess-1' }],
    );

    const refreshedStatus = JSON.parse(
      runtime.rpcGetPrivateMatchStatus(
        { userId: 'creator-1' },
        logger,
        nk,
        JSON.stringify({ code: created.code }),
      ),
    ) as { hasGuestJoined: boolean };

    expect(refreshedStatus.hasGuestJoined).toBe(false);
    expect(state.privateGuestUserId).toBeNull();
    expect(state.revision).toBe(1);
  });
});

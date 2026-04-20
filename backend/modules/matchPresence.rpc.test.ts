import './index';

type RuntimeGlobals = typeof globalThis & {
  matchInit: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error?: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    params: Record<string, unknown>
  ) => { state: unknown; tickRate: number; label: string };
  matchJoinAttempt: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error?: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    presence: Record<string, unknown>
  ) => { state: any; accept: boolean; rejectMessage?: string };
  matchJoin: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error?: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    presences: Array<Record<string, unknown>>
  ) => { state: any };
  matchLeave: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error?: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    presences: Array<Record<string, unknown>>
  ) => { state: any };
  matchLoop: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error?: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    messages: Array<Record<string, unknown>>
  ) => { state: any };
};

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
});

const createNakama = () => ({
  storageRead: jest.fn(() => []),
  storageWrite: jest.fn(),
});

const createDispatcher = () => ({
  broadcastMessage: jest.fn(),
});

const createPresence = (userId: string, sessionId: string) => ({
  userId,
  sessionId,
  node: 'node-1',
});

const createSpectatorPresence = (userId: string, sessionId: string) => ({
  userId,
  sessionId,
  node: 'node-1',
  metadata: {
    role: 'spectator',
  },
});

describe('authoritative match presence handling', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps a reconnected player authorized after an old session leaves', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-1' };

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
    });

    const lightPresenceOne = createPresence('light-user', 'light-session-1');
    const darkPresence = createPresence('dark-user', 'dark-session-1');
    const lightPresenceTwo = createPresence('light-user', 'light-session-2');

    let state = initialized.state;
    state = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, state, lightPresenceOne).state;
    state = runtime.matchJoin(ctx, logger, nk, dispatcher, 0, state, [lightPresenceOne]).state;
    state = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, state, darkPresence).state;
    state = runtime.matchJoin(ctx, logger, nk, dispatcher, 0, state, [darkPresence]).state;
    state = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, state, lightPresenceTwo).state;
    state = runtime.matchJoin(ctx, logger, nk, dispatcher, 0, state, [lightPresenceTwo]).state;
    state = runtime.matchLeave(ctx, logger, nk, dispatcher, 0, state, [lightPresenceOne]).state;

    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.9);

    const result = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, [
      {
        sender: lightPresenceTwo,
        opCode: 1,
        data: JSON.stringify({ type: 'roll_request' }),
      },
    ]);

    expect(result.state.revision).toBe(1);
    expect(dispatcher.broadcastMessage).toHaveBeenCalledWith(
      100,
      expect.any(String)
    );
    expect(dispatcher.broadcastMessage).not.toHaveBeenCalledWith(
      101,
      expect.stringContaining('"UNAUTHORIZED_PLAYER"'),
      expect.anything()
    );
  });

  it('accepts a spectator after a public human match has started without assigning a third player', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-spectator-1' };

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
      privateMatch: false,
      botMatch: false,
    });

    const lightPresence = createPresence('light-user', 'light-session-1');
    const darkPresence = createPresence('dark-user', 'dark-session-1');
    const spectatorPresence = createSpectatorPresence('spectator-user', 'spectator-session-1');

    let state = initialized.state;
    state = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, state, lightPresence).state;
    state = runtime.matchJoin(ctx, logger, nk, dispatcher, 0, state, [lightPresence]).state;
    state = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, state, darkPresence).state;
    state = runtime.matchJoin(ctx, logger, nk, dispatcher, 0, state, [darkPresence]).state;

    const spectatorAttempt = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, state, spectatorPresence);
    expect(spectatorAttempt.accept).toBe(true);
    state = runtime.matchJoin(ctx, logger, nk, dispatcher, 0, spectatorAttempt.state, [spectatorPresence]).state;

    expect((state as any).started).toBe(true);
    expect((state as any).assignments).toEqual({
      'light-user': 'light',
      'dark-user': 'dark',
    });
    expect(Object.keys((state as any).spectatorPresences)).toEqual(['spectator-user']);
  });

  it('accepts a spectator for a live open online match without requiring player ownership', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-open-spectator-1' };

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['creator-user', 'joiner-user'],
      modeId: 'standard',
      rankedMatch: true,
      privateMatch: false,
      botMatch: false,
    });

    const spectatorPresence = createSpectatorPresence('spectator-user', 'spectator-session-1');
    let state = initialized.state;
    state.openOnlineMatchId = 'open-live-1';
    state.openOnlineMatchCreatorUserId = 'creator-user';
    state.openOnlineMatchJoinerUserId = 'joiner-user';
    state.started = true;

    const spectatorAttempt = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, state, spectatorPresence);

    expect(spectatorAttempt.accept).toBe(true);
    state = runtime.matchJoin(ctx, logger, nk, dispatcher, 0, spectatorAttempt.state, [spectatorPresence]).state;

    expect(Object.keys((state as any).spectatorPresences)).toEqual(['spectator-user']);
    expect((state as any).assignments).toEqual({
      'creator-user': 'light',
      'joiner-user': 'dark',
    });
  });

  it('rejects spectator commands as read-only even when the user also has a player assignment', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-spectator-2' };

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
    });

    const lightPresence = createPresence('light-user', 'light-session-1');
    const darkPresence = createPresence('dark-user', 'dark-session-1');
    const spectatorPresence = createSpectatorPresence('light-user', 'light-spectator-session');

    let state = initialized.state;
    state = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, state, lightPresence).state;
    state = runtime.matchJoin(ctx, logger, nk, dispatcher, 0, state, [lightPresence]).state;
    state = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, state, darkPresence).state;
    state = runtime.matchJoin(ctx, logger, nk, dispatcher, 0, state, [darkPresence]).state;
    state = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, state, spectatorPresence).state;
    state = runtime.matchJoin(ctx, logger, nk, dispatcher, 0, state, [spectatorPresence]).state;

    dispatcher.broadcastMessage.mockClear();
    const result = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, [
      {
        sender: spectatorPresence,
        opCode: 1,
        data: JSON.stringify({ type: 'roll_request' }),
      },
    ]);

    expect(result.state.revision).toBe(0);
    expect(dispatcher.broadcastMessage).toHaveBeenCalledWith(
      101,
      expect.stringContaining('"READ_ONLY"'),
      [spectatorPresence],
    );
  });

  it('rejects spectator joins for private, unstarted, and finished matches', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const spectatorPresence = createSpectatorPresence('spectator-user', 'spectator-session-1');

    const unstarted = runtime.matchInit({ matchId: 'unstarted-match' }, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      privateMatch: false,
      botMatch: false,
    });
    expect(
      runtime.matchJoinAttempt({ matchId: 'unstarted-match' }, logger, nk, dispatcher, 0, unstarted.state, spectatorPresence)
        .accept,
    ).toBe(false);

    const privateMatch = runtime.matchInit({ matchId: 'private-match' }, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      privateMatch: true,
      privateCode: 'ABCDEFGH',
      privateCreatorUserId: 'light-user',
    });
    (privateMatch.state as any).started = true;
    expect(
      runtime.matchJoinAttempt({ matchId: 'private-match' }, logger, nk, dispatcher, 0, privateMatch.state, spectatorPresence)
        .accept,
    ).toBe(false);

    const finished = runtime.matchInit({ matchId: 'finished-match' }, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      privateMatch: false,
      botMatch: false,
    });
    (finished.state as any).started = true;
    (finished.state as any).gameState.winner = 'light';
    expect(
      runtime.matchJoinAttempt({ matchId: 'finished-match' }, logger, nk, dispatcher, 0, finished.state, spectatorPresence)
        .accept,
    ).toBe(false);
  });
});

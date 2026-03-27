import './index';

type RuntimeGlobals = typeof globalThis & {
  matchInit: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error?: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    params: Record<string, unknown>
  ) => { state: any; tickRate: number; label: string };
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

const parseLastSnapshot = (dispatcher: { broadcastMessage: jest.Mock }) => {
  const snapshotCall = [...dispatcher.broadcastMessage.mock.calls]
    .reverse()
    .find(([opCode]) => opCode === 100);

  if (!snapshotCall) {
    throw new Error('Expected a snapshot broadcast.');
  }

  return JSON.parse(snapshotCall[1] as string);
};

const joinPlayers = (
  runtime: RuntimeGlobals,
  ctx: Record<string, unknown>,
  logger: ReturnType<typeof createLogger>,
  nk: ReturnType<typeof createNakama>,
  dispatcher: ReturnType<typeof createDispatcher>,
  initialState: any
) => {
  const lightPresence = createPresence('light-user', 'light-session');
  const darkPresence = createPresence('dark-user', 'dark-session');

  let state = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, initialState, lightPresence).state;
  state = runtime.matchJoin(ctx, logger, nk, dispatcher, 0, state, [lightPresence]).state;
  state = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, state, darkPresence).state;
  state = runtime.matchJoin(ctx, logger, nk, dispatcher, 0, state, [darkPresence]).state;

  return {
    state,
    lightPresence,
    darkPresence,
  };
};

describe('authoritative online turn timer', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts the authoritative timer once both players have joined', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-timer-start' };
    jest.spyOn(Date, 'now').mockReturnValue(1_000);

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
    });

    joinPlayers(runtime, ctx, logger, nk, dispatcher, initialized.state);

    const snapshot = parseLastSnapshot(dispatcher);
    expect(snapshot.turnDurationMs).toBe(10_000);
    expect(snapshot.turnDeadlineMs).toBe(11_000);
    expect(snapshot.turnRemainingMs).toBe(10_000);
    expect(snapshot.activeTimedPlayer).toBe('light-user');
    expect(snapshot.activeTimedPlayerColor).toBe('light');
    expect(snapshot.activeTimedPhase).toBe('rolling');
    expect(snapshot.afkAccumulatedMs).toEqual({ light: 0, dark: 0 });
    expect(snapshot.afkRemainingMs).toBe(90_000);
  });

  it('auto-rolls and auto-moves the first valid move when a turn timer expires', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-timeout-autoplay' };
    const dateNowSpy = jest.spyOn(Date, 'now');
    dateNowSpy.mockReturnValue(1_000);

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
    });

    const { state: joinedState } = joinPlayers(runtime, ctx, logger, nk, dispatcher, initialized.state);
    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1);

    dateNowSpy.mockReturnValue(11_500);
    const result = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, joinedState, []);

    expect(result.state.revision).toBe(1);
    expect(result.state.gameState.phase).toBe('rolling');
    expect(result.state.gameState.currentTurn).toBe('dark');
    expect(result.state.gameState.rollValue).toBeNull();
    expect(result.state.gameState.light.pieces[0].position).toBe(0);
    expect(result.state.afk.light.accumulatedMs).toBe(10_000);
    expect(result.state.timer.activePlayerColor).toBe('dark');
    expect(result.state.timer.turnDeadlineMs).toBe(21_500);

    const snapshot = parseLastSnapshot(dispatcher);
    expect(snapshot.revision).toBe(1);
    expect(snapshot.gameState.phase).toBe('rolling');
    expect(snapshot.gameState.currentTurn).toBe('dark');
    expect(snapshot.activeTimedPlayerColor).toBe('dark');
    expect(snapshot.turnDeadlineMs).toBe(21_500);
  });

  it('keeps a private match playable after it has already started and someone disconnects', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-private-continue' };
    const dateNowSpy = jest.spyOn(Date, 'now');
    dateNowSpy.mockReturnValue(1_000);

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: false,
      privateMatch: true,
    });

    const { state: joinedState, lightPresence, darkPresence } = joinPlayers(
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      initialized.state
    );
    const afterLeave = runtime.matchLeave(ctx, logger, nk, dispatcher, 0, joinedState, [darkPresence]).state;
    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1);

    dateNowSpy.mockReturnValue(2_000);
    const result = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, afterLeave, [
      {
        sender: lightPresence,
        opCode: 1,
        data: JSON.stringify({ type: 'roll_request' }),
      },
    ]);

    expect(result.state.started).toBe(true);
    expect(result.state.revision).toBe(1);
    expect(result.state.gameState.phase).toBe('moving');
    expect(dispatcher.broadcastMessage).not.toHaveBeenCalledWith(
      101,
      expect.stringContaining('"MATCH_NOT_READY"'),
      expect.anything()
    );
  });

  it('forfeits a player who reaches ninety seconds of accumulated inactivity', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-afk-forfeit' };
    const dateNowSpy = jest.spyOn(Date, 'now');
    dateNowSpy.mockReturnValue(1_000);

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
    });

    const { state: joinedState } = joinPlayers(runtime, ctx, logger, nk, dispatcher, initialized.state);
    joinedState.afk.light.accumulatedMs = 80_000;
    joinedState.resultRecorded = true;

    dateNowSpy.mockReturnValue(11_500);
    const result = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, joinedState, []);

    expect(result.state.gameState.phase).toBe('ended');
    expect(result.state.gameState.winner).toBe('dark');
    expect(result.state.afk.light.accumulatedMs).toBe(90_000);
    expect(result.state.matchEnd).toEqual(
      expect.objectContaining({
        reason: 'forfeit_inactivity',
        winnerUserId: 'dark-user',
        loserUserId: 'light-user',
        forfeitingUserId: 'light-user',
      })
    );
    expect(result.state.timer.turnDeadlineMs).toBeNull();

    const snapshot = parseLastSnapshot(dispatcher);
    expect(snapshot.matchEnd).toEqual(
      expect.objectContaining({
        reason: 'forfeit_inactivity',
        winnerUserId: 'dark-user',
        forfeitingUserId: 'light-user',
      })
    );
    expect(snapshot.gameState.phase).toBe('ended');
    expect(snapshot.gameState.winner).toBe('dark');
  });
});

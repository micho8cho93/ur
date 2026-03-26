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
});

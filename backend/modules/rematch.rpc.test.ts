jest.mock('./elo', () => {
  const actual = jest.requireActual('./elo');
  return {
    ...actual,
    processRankedMatchResult: jest.fn(() => null),
  };
});

jest.mock('./progression', () => {
  const actual = jest.requireActual('./progression');
  return {
    ...actual,
    awardXpForMatchWin: jest.fn(() => ({ duplicate: true })),
  };
});

jest.mock('./challenges', () => {
  const actual = jest.requireActual('./challenges');
  return {
    ...actual,
    processCompletedMatch: jest.fn(() => null),
  };
});

jest.mock('./tournaments/matchResults', () => {
  const actual = jest.requireActual('./tournaments/matchResults');
  return {
    ...actual,
    processCompletedAuthoritativeTournamentMatch: jest.fn(() => ({
      skipped: true,
      duplicate: false,
      record: null,
      updatedRun: null,
      participantResolutions: [],
      finalizationResult: null,
      retryableFailure: false,
    })),
  };
});

import { MatchOpCode } from '../../shared/urMatchProtocol';
import './index';

type RuntimeGlobals = typeof globalThis & {
  matchInit: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock; matchCreate: jest.Mock },
    params: Record<string, unknown>
  ) => { state: any; tickRate: number; label: string };
  matchJoinAttempt: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock; matchCreate: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    presence: Record<string, unknown>
  ) => { state: any; accept: boolean; rejectMessage?: string };
  matchJoin: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock; matchCreate: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    presences: Record<string, unknown>[]
  ) => { state: any };
  matchLoop: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock; matchCreate: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    messages: Record<string, unknown>[]
  ) => { state: any };
};

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
});

const createDispatcher = () => ({
  broadcastMessage: jest.fn(),
});

const createNakama = () => {
  const storage = new Map<string, { collection: string; key: string; userId: string; version: string; value: unknown }>();

  return {
    storage,
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
    matchCreate: jest.fn(() => 'rematch-1'),
  };
};

const createPresence = (userId: string, sessionId: string) => ({
  userId,
  sessionId,
  node: 'node-1',
});

const joinPresence = ({
  runtime,
  ctx,
  logger,
  nk,
  dispatcher,
  state,
  presence,
}: {
  runtime: RuntimeGlobals;
  ctx: Record<string, unknown>;
  logger: ReturnType<typeof createLogger>;
  nk: ReturnType<typeof createNakama>;
  dispatcher: ReturnType<typeof createDispatcher>;
  state: any;
  presence: ReturnType<typeof createPresence>;
}) => {
  const attempted = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, state, presence);
  expect(attempted.accept).toBe(true);
  return runtime.matchJoin(ctx, logger, nk, dispatcher, 0, attempted.state, [presence]).state;
};

const completeMatchAndOpenRematchWindow = ({
  runtime,
  ctx,
  logger,
  nk,
  dispatcher,
  state,
  nowMs,
}: {
  runtime: RuntimeGlobals;
  ctx: Record<string, unknown>;
  logger: ReturnType<typeof createLogger>;
  nk: ReturnType<typeof createNakama>;
  dispatcher: ReturnType<typeof createDispatcher>;
  state: any;
  nowMs: number;
}) => {
  if (typeof (Date.now as unknown as { mockReturnValue?: (value: number) => void }).mockReturnValue === 'function') {
    (Date.now as unknown as { mockReturnValue: (value: number) => void }).mockReturnValue(nowMs);
  } else {
    jest.spyOn(Date, 'now').mockReturnValue(nowMs);
  }
  state.gameState = {
    ...state.gameState,
    phase: 'ended',
    winner: 'light',
  };
  dispatcher.broadcastMessage.mockClear();
  return runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, []).state;
};

describe('authoritative rematch runtime', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens the rematch window only for completed standard human matches', () => {
    const runtime = globalThis as RuntimeGlobals;
    const ctx = { matchId: 'match-1' };
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
    });

    let state = joinPresence({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state: initialized.state,
      presence: createPresence('light-user', 'light-session'),
    });
    state = joinPresence({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state,
      presence: createPresence('dark-user', 'dark-session'),
    });

    state = completeMatchAndOpenRematchWindow({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state,
      nowMs: 5_000,
    });

    expect(state.resultRecorded).toBe(true);
    expect(state.rematch.status).toBe('pending');
    expect(state.rematch.deadlineMs).toBe(20_000);
    expect(state.rematch.decisionsByUserId).toEqual({
      'light-user': 'pending',
      'dark-user': 'pending',
    });
  });

  it('does not open the rematch window for bot or tournament matches', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(5_000);

    const botCtx = { matchId: 'bot-match' };
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const botInitialized = runtime.matchInit(botCtx, logger, nk, {
      playerIds: ['light-user', 'bot-user'],
      modeId: 'standard',
      botMatch: true,
      botUserId: 'bot-user',
    });
    const botState = joinPresence({
      runtime,
      ctx: botCtx,
      logger,
      nk,
      dispatcher,
      state: botInitialized.state,
      presence: createPresence('light-user', 'light-session'),
    });
    botState.gameState = {
      ...botState.gameState,
      phase: 'ended',
      winner: 'light',
    };
    const botResult = runtime.matchLoop(botCtx, logger, nk, dispatcher, 1, botState, []).state;
    expect(botResult.rematch.status).toBe('idle');

    const tournamentCtx = { matchId: 'tournament-match' };
    const tournamentInitialized = runtime.matchInit(tournamentCtx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
      tournamentRunId: 'run-1',
      tournamentId: 'tournament-1',
      tournamentRound: 1,
    });
    let tournamentState = joinPresence({
      runtime,
      ctx: tournamentCtx,
      logger,
      nk,
      dispatcher,
      state: tournamentInitialized.state,
      presence: createPresence('light-user', 'light-session'),
    });
    tournamentState = joinPresence({
      runtime,
      ctx: tournamentCtx,
      logger,
      nk,
      dispatcher,
      state: tournamentState,
      presence: createPresence('dark-user', 'dark-session'),
    });
    tournamentState.gameState = {
      ...tournamentState.gameState,
      phase: 'ended',
      winner: 'light',
    };
    const tournamentResult = runtime.matchLoop(tournamentCtx, logger, nk, dispatcher, 1, tournamentState, []).state;
    expect(tournamentResult.resultRecorded).toBe(true);
    expect(tournamentResult.rematch.status).toBe('idle');
  });

  it('tracks the first acceptance and creates exactly one rematch when both players accept in the same tick', () => {
    const runtime = globalThis as RuntimeGlobals;
    const ctx = { matchId: 'match-1' };
    const logger = createLogger();
    const nk = createNakama();
    nk.matchCreate
      .mockReturnValueOnce('rematch-1')
      .mockReturnValueOnce('rematch-2');
    const dispatcher = createDispatcher();
    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
    });
    const lightPresence = createPresence('light-user', 'light-session');
    const darkPresence = createPresence('dark-user', 'dark-session');

    let state = joinPresence({ runtime, ctx, logger, nk, dispatcher, state: initialized.state, presence: lightPresence });
    state = joinPresence({ runtime, ctx, logger, nk, dispatcher, state, presence: darkPresence });
    state = completeMatchAndOpenRematchWindow({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state,
      nowMs: 5_000,
    });
    dispatcher.broadcastMessage.mockClear();

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(6_000);
    state = runtime.matchLoop(ctx, logger, nk, dispatcher, 2, state, [
      {
        sender: lightPresence,
        opCode: MatchOpCode.REMATCH_RESPONSE,
        data: JSON.stringify({ type: 'rematch_response', accepted: true }),
      },
      {
        sender: darkPresence,
        opCode: MatchOpCode.REMATCH_RESPONSE,
        data: JSON.stringify({ type: 'rematch_response', accepted: true }),
      },
    ]).state;

    expect(state.rematch.decisionsByUserId['light-user']).toBe('accepted');
    expect(state.rematch.decisionsByUserId['dark-user']).toBe('accepted');
    expect(state.rematch.status).toBe('matched');
    expect(state.rematch.nextMatchId).toBe('rematch-1');
    expect(nk.matchCreate).toHaveBeenCalledTimes(1);
    expect(nk.matchCreate).toHaveBeenCalledWith(
      'authoritative_match',
      expect.objectContaining({
        playerIds: ['light-user', 'dark-user'],
        modeId: 'standard',
        rankedMatch: true,
        privateMatch: false,
      }),
    );

    state = runtime.matchLoop(ctx, logger, nk, dispatcher, 3, state, [
      {
        sender: lightPresence,
        opCode: MatchOpCode.REMATCH_RESPONSE,
        data: JSON.stringify({ type: 'rematch_response', accepted: true }),
      },
    ]).state;

    expect(state.rematch.nextMatchId).toBe('rematch-1');
    expect(nk.matchCreate).toHaveBeenCalledTimes(1);
  });

  it('expires the rematch window after fifteen seconds without creating a rematch', () => {
    const runtime = globalThis as RuntimeGlobals;
    const ctx = { matchId: 'match-1' };
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
    });

    let state = joinPresence({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state: initialized.state,
      presence: createPresence('light-user', 'light-session'),
    });
    state = joinPresence({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state,
      presence: createPresence('dark-user', 'dark-session'),
    });
    state = completeMatchAndOpenRematchWindow({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state,
      nowMs: 5_000,
    });

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(20_001);
    state = runtime.matchLoop(ctx, logger, nk, dispatcher, 2, state, []).state;

    expect(state.rematch.status).toBe('expired');
    expect(state.rematch.nextMatchId).toBeNull();
    expect(nk.matchCreate).not.toHaveBeenCalled();
  });

  it('creates private rematches with a fresh reserved code for the same creator and guest', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const runtime = globalThis as RuntimeGlobals;
    const ctx = { matchId: 'private-match' };
    const logger = createLogger();
    const nk = createNakama();
    nk.matchCreate.mockReturnValue('private-rematch-1');
    const dispatcher = createDispatcher();
    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
      privateMatch: true,
      privateCode: 'OLDCODE1',
      privateCreatorUserId: 'dark-user',
      privateGuestUserId: 'light-user',
      winRewardSource: 'private_pvp_win',
      allowsChallengeRewards: true,
    });
    const lightPresence = createPresence('light-user', 'light-session');
    const darkPresence = createPresence('dark-user', 'dark-session');

    let state = joinPresence({ runtime, ctx, logger, nk, dispatcher, state: initialized.state, presence: lightPresence });
    state = joinPresence({ runtime, ctx, logger, nk, dispatcher, state, presence: darkPresence });
    state = completeMatchAndOpenRematchWindow({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state,
      nowMs: 5_000,
    });

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(6_000);
    state = runtime.matchLoop(ctx, logger, nk, dispatcher, 2, state, [
      {
        sender: lightPresence,
        opCode: MatchOpCode.REMATCH_RESPONSE,
        data: JSON.stringify({ type: 'rematch_response', accepted: true }),
      },
      {
        sender: darkPresence,
        opCode: MatchOpCode.REMATCH_RESPONSE,
        data: JSON.stringify({ type: 'rematch_response', accepted: true }),
      },
    ]).state;

    expect(state.rematch.status).toBe('matched');
    expect(state.rematch.nextMatchId).toBe('private-rematch-1');
    expect(state.rematch.nextPrivateCode).toBe('AAAAAAAA');
    expect(nk.matchCreate).toHaveBeenCalledWith(
      'authoritative_match',
      expect.objectContaining({
        playerIds: ['light-user', 'dark-user'],
        modeId: 'standard',
        privateMatch: true,
        privateCode: 'AAAAAAAA',
        privateCreatorUserId: 'dark-user',
        privateGuestUserId: 'light-user',
        winRewardSource: 'private_pvp_win',
      }),
    );
    expect(nk.storageWrite).toHaveBeenCalledWith([
      expect.objectContaining({
        collection: 'private_match_codes',
        key: 'AAAAAAAA',
        value: expect.objectContaining({
          code: 'AAAAAAAA',
          matchId: 'private-rematch-1',
          modeId: 'standard',
          creatorUserId: 'dark-user',
          joinedUserId: 'light-user',
        }),
      }),
    ]);
  });
});

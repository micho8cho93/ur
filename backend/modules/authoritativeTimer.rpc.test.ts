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
    processCompletedMatch: jest.fn(),
  };
});

jest.mock('./tournaments/matchResults', () => {
  const actual = jest.requireActual('./tournaments/matchResults');
  return {
    ...actual,
    processCompletedAuthoritativeTournamentMatch: jest.fn(),
  };
});

import { applyMove, createInitialState, getValidMoves } from '../../logic/engine';
import { PATH_LENGTH } from '../../logic/constants';
import { processCompletedMatch } from './challenges';
import { processRankedMatchResult } from './elo';
import { awardXpForMatchWin } from './progression';
import './index';

type RuntimeGlobals = typeof globalThis & {
  matchInit: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    params: Record<string, unknown>
  ) => { state: any; tickRate: number; label: string };
  matchJoinAttempt: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    presence: Record<string, unknown>
  ) => { state: any; accept: boolean; rejectMessage?: string };
  matchJoin: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    presences: Array<Record<string, unknown>>
  ) => { state: any };
  matchLoop: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    messages: Array<Record<string, unknown>>
  ) => { state: any };
};

const mockedProcessCompletedMatch = processCompletedMatch as jest.MockedFunction<typeof processCompletedMatch>;
const mockedProcessRankedMatchResult = processRankedMatchResult as jest.MockedFunction<typeof processRankedMatchResult>;
const mockedAwardXpForMatchWin = awardXpForMatchWin as jest.MockedFunction<typeof awardXpForMatchWin>;

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

const decodeLastSnapshot = (dispatcher: { broadcastMessage: jest.Mock }) => {
  const call = dispatcher.broadcastMessage.mock.calls.at(-1);
  expect(call?.[0]).toBe(100);
  return JSON.parse(call?.[1] as string);
};

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

const initializeStartedMatch = (runtime: RuntimeGlobals, nowSpy: jest.SpyInstance<number, []>) => {
  const ctx = { matchId: 'match-1' };
  const logger = createLogger();
  const nk = createNakama();
  const dispatcher = createDispatcher();
  const initialized = runtime.matchInit(ctx, logger, nk, {
    playerIds: ['light-user', 'dark-user'],
    modeId: 'standard',
    rankedMatch: true,
  });

  nowSpy.mockReturnValue(1_000);
  let state = joinPresence({
    runtime,
    ctx,
    logger,
    nk,
    dispatcher,
    state: initialized.state,
    presence: createPresence('light-user', 'light-session'),
  });

  nowSpy.mockReturnValue(2_000);
  state = joinPresence({
    runtime,
    ctx,
    logger,
    nk,
    dispatcher,
    state,
    presence: createPresence('dark-user', 'dark-session'),
  });

  return { ctx, logger, nk, dispatcher, state };
};

describe('authoritative online timer runtime', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts the authoritative timer only after both players join', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const ctx = { matchId: 'match-1' };
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
    });

    nowSpy.mockReturnValue(1_000);
    let state = joinPresence({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state: initialized.state,
      presence: createPresence('light-user', 'light-session'),
    });

    expect(state.started).toBe(false);
    expect(state.timer.turnStartedAtMs).toBeNull();
    expect(state.timer.turnDeadlineMs).toBeNull();
    expect(decodeLastSnapshot(dispatcher)).toEqual(
      expect.objectContaining({
        turnStartedAtMs: null,
        turnDeadlineMs: null,
        activeTimedPlayer: null,
      }),
    );

    nowSpy.mockReturnValue(2_000);
    state = joinPresence({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state,
      presence: createPresence('dark-user', 'dark-session'),
    });

    expect(state.started).toBe(true);
    expect(state.timer.turnStartedAtMs).toBe(2_000);
    expect(state.timer.turnDeadlineMs).toBe(12_000);
    expect(decodeLastSnapshot(dispatcher)).toEqual(
      expect.objectContaining({
        turnStartedAtMs: 2_000,
        turnDeadlineMs: 12_000,
        activeTimedPlayer: 'light-user',
        activeTimedPlayerColor: 'light',
      }),
    );
  });

  it('rolling-phase timeout auto-rolls and auto-moves the first legal move', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1);

    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);
    nowSpy.mockReturnValue(12_001);
    dispatcher.broadcastMessage.mockClear();

    const result = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, []);

    expect(result.state.revision).toBe(1);
    expect(result.state.gameState.light.pieces[0].position).toBe(0);
    expect(result.state.gameState.currentTurn).toBe('dark');
    expect(result.state.gameState.phase).toBe('rolling');
    expect(result.state.afk.light.accumulatedMs).toBe(10_000);
    expect(result.state.timer.turnStartedAtMs).toBe(12_001);
    expect(result.state.timer.turnDeadlineMs).toBe(22_001);
  });

  it('moving-phase timeout auto-moves the first valid move', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);
    nowSpy.mockReturnValue(12_001);
    dispatcher.broadcastMessage.mockClear();

    state.gameState = {
      ...createInitialState(),
      currentTurn: 'light',
      phase: 'moving',
      rollValue: 1,
    };
    state.timer.turnStartedAtMs = 1_000;
    state.timer.turnDeadlineMs = 11_000;
    state.timer.activePlayerColor = 'light';
    state.timer.activePlayerUserId = 'light-user';
    state.timer.activePhase = 'moving';

    const expectedMove = getValidMoves(state.gameState, 1)[0];
    const expectedState = applyMove(state.gameState, expectedMove);

    const result = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, []);

    expect(result.state.gameState).toEqual(expectedState);
    expect(result.state.afk.light.accumulatedMs).toBe(10_000);
    expect(result.state.timer.turnStartedAtMs).toBe(12_001);
    expect(result.state.timer.turnDeadlineMs).toBe(22_001);
  });

  it('gives a rosette extra turn a fresh 10-second timer', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);
    nowSpy.mockReturnValue(12_001);
    dispatcher.broadcastMessage.mockClear();

    const rosetteState = createInitialState();
    rosetteState.currentTurn = 'light';
    rosetteState.phase = 'moving';
    rosetteState.rollValue = 1;
    rosetteState.light.pieces[0].position = 2;
    state.gameState = rosetteState;
    state.timer.turnStartedAtMs = 1_000;
    state.timer.turnDeadlineMs = 11_000;
    state.timer.activePlayerColor = 'light';
    state.timer.activePlayerUserId = 'light-user';
    state.timer.activePhase = 'moving';

    const result = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, []);

    expect(result.state.gameState.light.pieces[0].position).toBe(3);
    expect(result.state.gameState.currentTurn).toBe('light');
    expect(result.state.gameState.phase).toBe('rolling');
    expect(result.state.timer.activePlayerColor).toBe('light');
    expect(result.state.timer.activePhase).toBe('rolling');
    expect(result.state.timer.turnStartedAtMs).toBe(12_001);
    expect(result.state.timer.turnDeadlineMs).toBe(22_001);
  });

  it('hands off the turn and resets the timer when a timeout roll has no legal moves', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1);

    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);
    nowSpy.mockReturnValue(12_001);
    dispatcher.broadcastMessage.mockClear();

    const result = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, []);

    expect(result.state.gameState.currentTurn).toBe('dark');
    expect(result.state.gameState.phase).toBe('rolling');
    expect(result.state.gameState.rollValue).toBeNull();
    expect(result.state.gameState.history.at(-1)).toBe('light rolled 0 but had no moves.');
    expect(result.state.timer.activePlayerColor).toBe('dark');
    expect(result.state.timer.activePhase).toBe('rolling');
    expect(result.state.timer.turnStartedAtMs).toBe(12_001);
    expect(result.state.timer.turnDeadlineMs).toBe(22_001);
  });

  it('forfeits the player that reaches 90 seconds of accumulated inactivity', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);
    nowSpy.mockReturnValue(12_001);
    dispatcher.broadcastMessage.mockClear();

    state.afk.light.accumulatedMs = 80_000;

    const result = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, []);

    expect(result.state.gameState.winner).toBe('dark');
    expect(result.state.gameState.phase).toBe('ended');
    expect(result.state.matchEnd).toEqual({
      reason: 'forfeit_inactivity',
      winnerUserId: 'dark-user',
      loserUserId: 'light-user',
      forfeitingUserId: 'light-user',
      message: null,
    });
    expect(result.state.resultRecorded).toBe(true);
    expect(result.state.timer.turnStartedAtMs).toBeNull();
    expect(result.state.timer.turnDeadlineMs).toBeNull();
  });

  it('records terminal results only once', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);
    nowSpy.mockReturnValue(2_500);
    dispatcher.broadcastMessage.mockClear();

    mockedProcessCompletedMatch.mockClear();
    mockedProcessRankedMatchResult.mockClear();
    mockedAwardXpForMatchWin.mockClear();

    state.gameState = {
      ...createInitialState(),
      currentTurn: 'light',
      phase: 'moving',
      rollValue: 1,
    };
    state.gameState.light.finishedCount = state.gameState.matchConfig.pieceCountPerSide - 1;
    state.gameState.light.pieces[0].position = PATH_LENGTH - 1;
    state.timer.turnStartedAtMs = 2_000;
    state.timer.turnDeadlineMs = 12_000;
    state.timer.activePlayerColor = 'light';
    state.timer.activePlayerUserId = 'light-user';
    state.timer.activePhase = 'moving';

    const winningMove = {
      pieceId: state.gameState.light.pieces[0].id,
      fromIndex: PATH_LENGTH - 1,
      toIndex: PATH_LENGTH,
    };

    runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, [
      {
        sender: createPresence('light-user', 'light-session'),
        opCode: 2,
        data: JSON.stringify({ type: 'move_request', move: winningMove }),
      },
    ]);

    expect(state.resultRecorded).toBe(true);
    expect(mockedProcessCompletedMatch).toHaveBeenCalledTimes(2);
    expect(mockedProcessRankedMatchResult).toHaveBeenCalledTimes(1);
    expect(mockedAwardXpForMatchWin).toHaveBeenCalledTimes(1);

    runtime.matchLoop(ctx, logger, nk, dispatcher, 2, state, [
      {
        sender: createPresence('light-user', 'light-session'),
        opCode: 2,
        data: JSON.stringify({ type: 'move_request', move: winningMove }),
      },
    ]);

    expect(mockedProcessCompletedMatch).toHaveBeenCalledTimes(2);
    expect(mockedProcessRankedMatchResult).toHaveBeenCalledTimes(1);
    expect(mockedAwardXpForMatchWin).toHaveBeenCalledTimes(1);
  });
});

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
  matchLeave: (
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
    expect(result.state.rollDisplay).toEqual({ value: 1, label: null });
    expect(result.state.afk.light.accumulatedMs).toBe(10_000);
    expect(result.state.timer.turnStartedAtMs).toBe(12_001);
    expect(result.state.timer.turnDeadlineMs).toBe(22_001);
    expect(decodeLastSnapshot(dispatcher)).toEqual(
      expect.objectContaining({
        rollDisplayValue: 1,
        rollDisplayLabel: null,
      }),
    );
  });

  it('starts tournament bot matches with one human presence and plays bot turns on the short bot delay', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1);

    const ctx = { matchId: 'match-bot-1' };
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['human-user', 'tournament-bot:run-1:2'],
      modeId: 'standard',
      rankedMatch: true,
      botMatch: true,
      botUserId: 'tournament-bot:run-1:2',
      botDifficulty: 'hard',
      botDisplayName: 'Hard Bot 1',
      tournamentRunId: 'run-1',
      tournamentId: 'tour-1',
      tournamentRound: 1,
      tournamentEntryId: 'round-1-match-1',
    });

    nowSpy.mockReturnValue(2_000);
    const joinedState = joinPresence({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state: initialized.state,
      presence: createPresence('human-user', 'human-session'),
    });

    expect(joinedState.started).toBe(true);
    expect(joinedState.timer.turnDeadlineMs).toBe(12_000);
    expect(joinedState.playerTitles['tournament-bot:run-1:2']).toBe('Hard Bot 1');

    joinedState.gameState.currentTurn = 'dark';
    joinedState.gameState.phase = 'rolling';
    joinedState.timer.turnDurationMs = 850;
    joinedState.timer.turnStartedAtMs = 2_000;
    joinedState.timer.turnDeadlineMs = 2_850;
    joinedState.timer.activePlayerColor = 'dark';
    joinedState.timer.activePlayerUserId = 'tournament-bot:run-1:2';
    joinedState.timer.activePhase = 'rolling';
    dispatcher.broadcastMessage.mockClear();

    nowSpy.mockReturnValue(2_851);
    const result = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, joinedState, []);

    expect(result.state.afk.dark.accumulatedMs).toBe(0);
    expect(result.state.gameState.dark.pieces.some((piece: { position: number }) => piece.position === 0)).toBe(true);
    expect(result.state.gameState.currentTurn).toBe('light');
    expect(result.state.gameState.phase).toBe('rolling');
    expect(result.state.timer.turnDurationMs).toBe(10_000);
    expect(result.state.timer.turnStartedAtMs).toBe(2_851);
    expect(result.state.timer.turnDeadlineMs).toBe(12_851);
  });

  it('does not reset AFK when a convenience auto-roll is submitted', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1);

    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);
    nowSpy.mockReturnValue(2_500);
    dispatcher.broadcastMessage.mockClear();
    state.afk.light.accumulatedMs = 20_000;

    const result = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, [
      {
        sender: createPresence('light-user', 'light-session'),
        opCode: 1,
        data: JSON.stringify({ type: 'roll_request', autoTriggered: true }),
      },
    ]);

    expect(result.state.revision).toBe(1);
    expect(result.state.afk.light.accumulatedMs).toBe(20_000);
  });

  it('starts reconnect grace and pauses the turn when an assigned player disconnects', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);

    nowSpy.mockReturnValue(4_000);
    dispatcher.broadcastMessage.mockClear();
    const result = runtime.matchLeave(ctx, logger, nk, dispatcher, 1, state, [
      createPresence('dark-user', 'dark-session'),
    ]);

    expect(result.state.disconnect.dark.disconnectedAtMs).toBe(4_000);
    expect(result.state.disconnect.dark.reconnectDeadlineMs).toBe(19_000);
    expect(result.state.timer.turnStartedAtMs).toBeNull();
    expect(result.state.timer.turnDeadlineMs).toBeNull();
    expect(result.state.timer.pausedTurnRemainingMs).toBe(8_000);
    expect(decodeLastSnapshot(dispatcher)).toEqual(
      expect.objectContaining({
        reconnectingPlayer: 'dark-user',
        reconnectingPlayerColor: 'dark',
        reconnectGraceDurationMs: 15_000,
        reconnectDeadlineMs: 19_000,
        reconnectRemainingMs: 15_000,
        turnDeadlineMs: null,
      }),
    );
  });

  it('resumes the paused turn with a reconnect buffer when the disconnected player rejoins', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);

    nowSpy.mockReturnValue(11_500);
    let nextState = runtime.matchLeave(ctx, logger, nk, dispatcher, 1, state, [
      createPresence('dark-user', 'dark-session'),
    ]).state;

    nowSpy.mockReturnValue(12_000);
    dispatcher.broadcastMessage.mockClear();
    nextState = joinPresence({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state: nextState,
      presence: createPresence('dark-user', 'dark-session-2'),
    });

    expect(nextState.disconnect.dark.reconnectDeadlineMs).toBeNull();
    expect(nextState.timer.turnStartedAtMs).toBe(12_000);
    expect(nextState.timer.turnDeadlineMs).toBe(17_000);
    expect(nextState.timer.turnDurationMs).toBe(5_000);
    expect(nextState.timer.resetReason).toBe('resumed_after_reconnect');
    expect(decodeLastSnapshot(dispatcher)).toEqual(
      expect.objectContaining({
        reconnectingPlayer: null,
        reconnectingPlayerColor: null,
        turnStartedAtMs: 12_000,
        turnDeadlineMs: 17_000,
        turnDurationMs: 5_000,
      }),
    );
  });

  it('clears AFK debt when a disconnected player rejoins', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);

    state.afk.dark.accumulatedMs = 20_000;
    state.afk.dark.timeoutCount = 2;

    nowSpy.mockReturnValue(11_500);
    let nextState = runtime.matchLeave(ctx, logger, nk, dispatcher, 1, state, [
      createPresence('dark-user', 'dark-session'),
    ]).state;

    nowSpy.mockReturnValue(12_000);
    dispatcher.broadcastMessage.mockClear();
    nextState = joinPresence({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state: nextState,
      presence: createPresence('dark-user', 'dark-session-2'),
    });

    expect(nextState.afk.dark.accumulatedMs).toBe(0);
    expect(nextState.afk.dark.timeoutCount).toBe(0);
    expect(nextState.afk.dark.lastMeaningfulActionAtMs).toBe(12_000);
  });

  it('does not clear AFK debt when a second concurrent session joins without a disconnect gap', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);

    state.afk.light.accumulatedMs = 10_000;
    state.afk.light.timeoutCount = 1;

    nowSpy.mockReturnValue(5_000);
    dispatcher.broadcastMessage.mockClear();
    const nextState = joinPresence({
      runtime,
      ctx,
      logger,
      nk,
      dispatcher,
      state,
      presence: createPresence('light-user', 'light-session-2'),
    });

    expect(nextState.afk.light.accumulatedMs).toBe(10_000);
    expect(nextState.afk.light.timeoutCount).toBe(1);
    expect(nextState.afk.light.lastMeaningfulActionAtMs).toBeNull();
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

  it('resets the authoritative timer after a player move lands on a rosette', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);
    nowSpy.mockReturnValue(2_500);
    dispatcher.broadcastMessage.mockClear();

    state.gameState = createInitialState();
    state.gameState.currentTurn = 'light';
    state.gameState.phase = 'moving';
    state.gameState.rollValue = 1;
    state.gameState.light.pieces[0].position = 2;
    state.timer.turnStartedAtMs = 2_000;
    state.timer.turnDeadlineMs = 12_000;
    state.timer.activePlayerColor = 'light';
    state.timer.activePlayerUserId = 'light-user';
    state.timer.activePhase = 'moving';

    const rosetteMove = {
      pieceId: state.gameState.light.pieces[0].id,
      fromIndex: 2,
      toIndex: 3,
    };

    const result = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, [
      {
        sender: createPresence('light-user', 'light-session'),
        opCode: 2,
        data: JSON.stringify({ type: 'move_request', move: rosetteMove }),
      },
    ]);

    expect(result.state.gameState.light.pieces[0].position).toBe(3);
    expect(result.state.gameState.currentTurn).toBe('light');
    expect(result.state.gameState.phase).toBe('rolling');
    expect(result.state.timer.activePlayerColor).toBe('light');
    expect(result.state.timer.activePhase).toBe('rolling');
    expect(result.state.timer.turnStartedAtMs).toBe(2_500);
    expect(result.state.timer.turnDeadlineMs).toBe(12_500);
  });

  it('keeps the match alive if broadcasting a rosette extra-turn snapshot throws', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);
    nowSpy.mockReturnValue(2_500);
    dispatcher.broadcastMessage.mockClear();
    dispatcher.broadcastMessage.mockImplementation(() => {
      throw new Error('dispatcher failed');
    });

    state.gameState = createInitialState();
    state.gameState.currentTurn = 'light';
    state.gameState.phase = 'moving';
    state.gameState.rollValue = 1;
    state.gameState.light.pieces[0].position = 2;
    state.timer.turnStartedAtMs = 2_000;
    state.timer.turnDeadlineMs = 12_000;
    state.timer.activePlayerColor = 'light';
    state.timer.activePlayerUserId = 'light-user';
    state.timer.activePhase = 'moving';

    const rosetteMove = {
      pieceId: state.gameState.light.pieces[0].id,
      fromIndex: 2,
      toIndex: 3,
    };

    expect(() =>
      runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, [
        {
          sender: createPresence('light-user', 'light-session'),
          opCode: 2,
          data: JSON.stringify({ type: 'move_request', move: rosetteMove }),
        },
      ]),
    ).not.toThrow();

    expect(state.started).toBe(true);
    expect(state.gameState.light.pieces[0].position).toBe(3);
    expect(state.gameState.currentTurn).toBe('light');
    expect(state.gameState.phase).toBe('rolling');
    expect(state.timer.activePlayerColor).toBe('light');
    expect(state.timer.activePhase).toBe('rolling');
    expect(logger.error).toHaveBeenCalled();
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
    expect(result.state.rollDisplay).toEqual({ value: 0, label: null });
    expect(result.state.timer.activePlayerColor).toBe('dark');
    expect(result.state.timer.activePhase).toBe('rolling');
    expect(result.state.timer.turnStartedAtMs).toBe(12_001);
    expect(result.state.timer.turnDeadlineMs).toBe(22_001);
    expect(decodeLastSnapshot(dispatcher)).toEqual(
      expect.objectContaining({
        rollDisplayValue: 0,
        rollDisplayLabel: null,
      }),
    );
  });

  it('forfeits the player that reaches three timed-out turns of accumulated inactivity', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);
    nowSpy.mockReturnValue(12_001);
    dispatcher.broadcastMessage.mockClear();
    mockedProcessCompletedMatch.mockClear();
    mockedProcessRankedMatchResult.mockClear();
    mockedAwardXpForMatchWin.mockClear();

    state.afk.light.accumulatedMs = 20_000;

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
    expect(mockedProcessCompletedMatch).not.toHaveBeenCalled();
    expect(mockedProcessRankedMatchResult).toHaveBeenCalledTimes(1);
    expect(mockedAwardXpForMatchWin).toHaveBeenCalledTimes(1);
  });

  it('forfeits the disconnected player when reconnect grace expires', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const { ctx, logger, nk, dispatcher, state } = initializeStartedMatch(runtime, nowSpy);

    nowSpy.mockReturnValue(4_000);
    let nextState = runtime.matchLeave(ctx, logger, nk, dispatcher, 1, state, [
      createPresence('dark-user', 'dark-session'),
    ]).state;

    nowSpy.mockReturnValue(19_001);
    dispatcher.broadcastMessage.mockClear();
    mockedProcessCompletedMatch.mockClear();
    mockedProcessRankedMatchResult.mockClear();
    mockedAwardXpForMatchWin.mockClear();

    nextState = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, nextState, []).state;

    expect(nextState.gameState.winner).toBe('light');
    expect(nextState.gameState.phase).toBe('ended');
    expect(nextState.matchEnd).toEqual({
      reason: 'forfeit_disconnect',
      winnerUserId: 'light-user',
      loserUserId: 'dark-user',
      forfeitingUserId: 'dark-user',
      message: null,
    });
    expect(nextState.resultRecorded).toBe(true);
    expect(nextState.timer.turnStartedAtMs).toBeNull();
    expect(nextState.timer.turnDeadlineMs).toBeNull();
    expect(mockedProcessCompletedMatch).not.toHaveBeenCalled();
    expect(mockedProcessRankedMatchResult).toHaveBeenCalledTimes(1);
    expect(mockedAwardXpForMatchWin).toHaveBeenCalledTimes(1);
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

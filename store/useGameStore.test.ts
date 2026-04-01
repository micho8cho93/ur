import { useGameStore } from './useGameStore';
import * as engine from '@/logic/engine';
import { getMatchConfig } from '@/logic/matchConfigs';
import { GameState, MoveAction } from '@/logic/types';
import { StateSnapshotPayload } from '@/shared/urMatchProtocol';

jest.mock('@/logic/engine', () => {
  const actual = jest.requireActual('@/logic/engine');
  return {
    ...actual,
    rollDice: jest.fn(actual.rollDice),
  };
});

const mockedRollDice = engine.rollDice as jest.MockedFunction<typeof engine.rollDice>;

const makeState = (overrides: Partial<GameState> = {}): GameState => {
  const state = engine.createInitialState();
  return {
    ...state,
    ...overrides,
  };
};

const makeSnapshot = (
  overrides: Partial<StateSnapshotPayload> = {},
): StateSnapshotPayload => ({
  type: 'state_snapshot',
  matchId: 'match-1',
  revision: 1,
  gameState: makeState(),
  players: {
    light: {
      userId: 'light-user',
      title: 'Michel',
    },
    dark: {
      userId: 'dark-user',
      title: 'Guest',
    },
  },
  ...overrides,
});

describe('useGameStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    useGameStore.getState().reset();
  });

  it('initGame() resets match/game-derived state cleanly', () => {
    useGameStore.setState({
      onlineMode: 'nakama',
      matchId: 'old-match',
      botDifficulty: 'hard',
      validMoves: [{ pieceId: 'light-0', fromIndex: -1, toIndex: 1 }],
      matchPresences: ['u-1'],
      lastProgressionAward: {
        matchId: 'old-match',
        source: 'pvp_win',
        duplicate: false,
        awardedXp: 100,
        previousTotalXp: 0,
        newTotalXp: 100,
        previousRank: 'Laborer',
        newRank: 'Servant of the Temple',
        rankChanged: true,
        progression: {
          totalXp: 100,
          currentRank: 'Servant of the Temple',
          currentRankThreshold: 100,
          nextRank: 'Apprentice Scribe',
          nextRankThreshold: 250,
          xpIntoCurrentRank: 0,
          xpNeededForNextRank: 150,
          progressPercent: 0,
        },
      },
      lastEloRatingChange: {
        type: 'elo_rating_update',
        leaderboardId: 'elo_global',
        matchId: 'old-match',
        duplicate: false,
        player: {
          userId: 'u-1',
          usernameDisplay: 'Michel',
          oldRating: 1200,
          newRating: 1216,
          delta: 16,
          provisional: true,
          ratedGames: 1,
          ratedWins: 1,
          ratedLosses: 0,
          rank: 42,
        },
        opponent: {
          userId: 'u-2',
          usernameDisplay: 'RoyalTwo',
          oldRating: 1200,
          newRating: 1184,
          delta: -16,
          provisional: true,
          ratedGames: 1,
          ratedWins: 0,
          ratedLosses: 1,
          rank: 43,
        },
      },
      socketState: 'connected',
      serverRevision: 12,
      playerColor: 'light',
      authoritativeServerTimeMs: 5_000,
      authoritativeTurnDurationMs: 10_000,
      authoritativeTurnStartedAtMs: 1_000,
      authoritativeTurnDeadlineMs: 11_000,
      authoritativeTurnRemainingMs: 6_000,
      authoritativeActiveTimedPlayer: 'light-user',
      authoritativeActiveTimedPlayerColor: 'light',
      authoritativeActiveTimedPhase: 'rolling',
      authoritativeHistoryCount: 7,
      authoritativePlayers: {
        light: { userId: 'light-user', title: 'Michel' },
        dark: { userId: 'dark-user', title: 'Guest' },
      },
      authoritativeRollDisplayValue: 4,
      authoritativeRollDisplayLabel: null,
      authoritativeAfkAccumulatedMs: { light: 0, dark: 20_000 },
      authoritativeAfkRemainingMs: 70_000,
      authoritativeReconnectingPlayer: 'dark-user',
      authoritativeReconnectingPlayerColor: 'dark',
      authoritativeReconnectGraceDurationMs: 15_000,
      authoritativeReconnectDeadlineMs: 24_000,
      authoritativeReconnectRemainingMs: 15_000,
      authoritativeMatchEnd: {
        reason: 'completed',
        winnerUserId: 'light-user',
        loserUserId: 'dark-user',
        forfeitingUserId: null,
        message: null,
      },
      authoritativeSnapshotReceivedAtMs: 9_000,
      rollCommandSender: jest.fn(),
      moveCommandSender: jest.fn(),
      gameState: makeState({ phase: 'moving', rollValue: 2 }),
    });

    useGameStore.getState().initGame('new-match');
    const state = useGameStore.getState();

    expect(state.matchId).toBe('new-match');
    expect(state.gameState).toEqual(engine.createInitialState());
    expect(state.validMoves).toEqual([]);
    expect(state.matchPresences).toEqual([]);
    expect(state.authoritativeServerTimeMs).toBeNull();
    expect(state.authoritativeTurnDurationMs).toBeNull();
    expect(state.authoritativeTurnStartedAtMs).toBeNull();
    expect(state.authoritativeTurnDeadlineMs).toBeNull();
    expect(state.authoritativeTurnRemainingMs).toBeNull();
    expect(state.authoritativeActiveTimedPlayer).toBeNull();
    expect(state.authoritativeActiveTimedPlayerColor).toBeNull();
    expect(state.authoritativeActiveTimedPhase).toBeNull();
    expect(state.authoritativePlayers).toBeNull();
    expect(state.authoritativeRollDisplayValue).toBeNull();
    expect(state.authoritativeRollDisplayLabel).toBeNull();
    expect(state.authoritativeAfkAccumulatedMs).toBeNull();
    expect(state.authoritativeAfkRemainingMs).toBeNull();
    expect(state.authoritativeReconnectingPlayer).toBeNull();
    expect(state.authoritativeReconnectingPlayerColor).toBeNull();
    expect(state.authoritativeReconnectGraceDurationMs).toBeNull();
    expect(state.authoritativeReconnectDeadlineMs).toBeNull();
    expect(state.authoritativeReconnectRemainingMs).toBeNull();
    expect(state.authoritativeMatchEnd).toBeNull();
    expect(state.authoritativeSnapshotReceivedAtMs).toBeNull();
    expect(state.lastProgressionAward).toBeNull();
    expect(state.lastEloRatingChange).toBeNull();
    expect(state.socketState).toBe('idle');
    expect(state.serverRevision).toBe(0);
    expect(state.playerColor).toBeNull();
    expect(state.botDifficulty).toBe('easy');
    expect(state.rollCommandSender).toBeNull();
    expect(state.moveCommandSender).toBeNull();
  });

  it('initGame() accepts an explicit bot difficulty for offline matches', () => {
    useGameStore.getState().initGame('bot-match', { botDifficulty: 'perfect' });

    const state = useGameStore.getState();
    expect(state.matchId).toBe('bot-match');
    expect(state.botDifficulty).toBe('perfect');
  });

  it('initGame() accepts an explicit match config for practice variants', () => {
    const matchConfig = getMatchConfig('gameMode_5_pieces');

    useGameStore.getState().initGame('practice-match', { matchConfig });

    const state = useGameStore.getState();
    expect(state.matchId).toBe('practice-match');
    expect(state.gameState.matchConfig).toEqual(matchConfig);
    expect(state.gameState.light.pieces).toHaveLength(5);
    expect(state.gameState.dark.pieces).toHaveLength(5);
  });

  it('setGameStateFromServer() recomputes validMoves only when moving with rollValue', () => {
    const movingState = makeState({ phase: 'moving', rollValue: 1 });

    useGameStore.getState().setGameStateFromServer(movingState);

    expect(useGameStore.getState().validMoves.length).toBeGreaterThan(0);

    const rollingState = makeState({ phase: 'rolling', rollValue: 1 });
    useGameStore.getState().setGameStateFromServer(rollingState);

    expect(useGameStore.getState().validMoves).toEqual([]);

    const movingNoRollState = makeState({ phase: 'moving', rollValue: null });
    useGameStore.getState().setGameStateFromServer(movingNoRollState);

    expect(useGameStore.getState().validMoves).toEqual([]);
  });

  it('applyServerSnapshot() ignores stale revisions and accepts newer ones for the active match with authoritative timer metadata', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-27T12:00:00.000Z'));
    useGameStore.setState({ serverRevision: 3, matchId: 'keep-match' });
    const staleState = makeState({ phase: 'moving', rollValue: 1 });

    useGameStore.getState().applyServerSnapshot(
      makeSnapshot({
        matchId: 'stale-match',
        revision: 2,
        gameState: staleState,
        serverTimeMs: 1_000,
        turnDurationMs: 10_000,
        turnStartedAtMs: 500,
        turnDeadlineMs: 10_500,
        turnRemainingMs: 9_500,
      }),
    );

    expect(useGameStore.getState().serverRevision).toBe(3);
    expect(useGameStore.getState().matchId).toBe('keep-match');
    expect(useGameStore.getState().gameState).toEqual(engine.createInitialState());

    const newerState = makeState({ phase: 'moving', rollValue: 1 });
    useGameStore.getState().applyServerSnapshot(
      makeSnapshot({
        matchId: 'keep-match',
        revision: 4,
        gameState: newerState,
        historyCount: 42,
        serverTimeMs: 2_000,
        turnDurationMs: 10_000,
        turnStartedAtMs: 1_500,
        turnDeadlineMs: 11_500,
        turnRemainingMs: 9_500,
        activeTimedPlayer: 'light-user',
        activeTimedPlayerColor: 'light',
        activeTimedPhase: 'moving',
        rollDisplayValue: 3,
        rollDisplayLabel: 'No Move',
        afkAccumulatedMs: { light: 0, dark: 25_000 },
        afkRemainingMs: 20_000,
        reconnectingPlayer: 'dark-user',
        reconnectingPlayerColor: 'dark',
        reconnectGraceDurationMs: 15_000,
        reconnectDeadlineMs: 17_000,
        reconnectRemainingMs: 15_000,
        matchEnd: {
          reason: 'completed',
          winnerUserId: 'light-user',
          loserUserId: 'dark-user',
          forfeitingUserId: null,
          message: null,
        },
      }),
    );

    const state = useGameStore.getState();
    expect(state.serverRevision).toBe(4);
    expect(state.matchId).toBe('keep-match');
    expect(state.gameState).toEqual(newerState);
    expect(state.validMoves.length).toBeGreaterThan(0);
    expect(state.authoritativeServerTimeMs).toBe(2_000);
    expect(state.authoritativeTurnDurationMs).toBe(10_000);
    expect(state.authoritativeTurnStartedAtMs).toBe(1_500);
    expect(state.authoritativeTurnDeadlineMs).toBe(11_500);
    expect(state.authoritativeTurnRemainingMs).toBe(9_500);
    expect(state.authoritativeActiveTimedPlayer).toBe('light-user');
    expect(state.authoritativeActiveTimedPlayerColor).toBe('light');
    expect(state.authoritativeActiveTimedPhase).toBe('moving');
    expect(state.authoritativePlayers).toEqual({
      light: { userId: 'light-user', title: 'Michel' },
      dark: { userId: 'dark-user', title: 'Guest' },
    });
    expect(state.authoritativeRollDisplayValue).toBe(3);
    expect(state.authoritativeRollDisplayLabel).toBe('No Move');
    expect(state.authoritativeHistoryCount).toBe(42);
    expect(state.authoritativeAfkAccumulatedMs).toEqual({ light: 0, dark: 25_000 });
    expect(state.authoritativeAfkRemainingMs).toBe(20_000);
    expect(state.authoritativeReconnectingPlayer).toBe('dark-user');
    expect(state.authoritativeReconnectingPlayerColor).toBe('dark');
    expect(state.authoritativeReconnectGraceDurationMs).toBe(15_000);
    expect(state.authoritativeReconnectDeadlineMs).toBe(17_000);
    expect(state.authoritativeReconnectRemainingMs).toBe(15_000);
    expect(state.authoritativeMatchEnd).toEqual({
      reason: 'completed',
      winnerUserId: 'light-user',
      loserUserId: 'dark-user',
      forfeitingUserId: null,
      message: null,
    });
    expect(state.authoritativeSnapshotReceivedAtMs).toBe(new Date('2026-03-27T12:00:00.000Z').getTime());
  });

  it('applyServerSnapshot() ignores newer snapshots that belong to a different active match', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-27T12:00:00.000Z'));
    useGameStore.setState({
      matchId: 'active-match',
      serverRevision: 0,
      gameState: engine.createInitialState(),
    });

    const staleForeignState = makeState({
      phase: 'ended',
      winner: 'dark',
    });

    useGameStore.getState().applyServerSnapshot(
      makeSnapshot({
        matchId: 'previous-match',
        revision: 99,
        gameState: staleForeignState,
        matchEnd: {
          reason: 'completed',
          winnerUserId: 'dark-user',
          loserUserId: 'light-user',
          forfeitingUserId: null,
          message: null,
        },
      }),
    );

    const state = useGameStore.getState();
    expect(state.matchId).toBe('active-match');
    expect(state.serverRevision).toBe(0);
    expect(state.gameState).toEqual(engine.createInitialState());
    expect(state.authoritativeMatchEnd).toBeNull();
  });

  it('offline roll() during rolling phase sets rollValue, moves to moving phase, and computes validMoves', () => {
    mockedRollDice.mockReturnValue(1);

    useGameStore.getState().roll();

    const state = useGameStore.getState();
    expect(mockedRollDice).toHaveBeenCalledTimes(1);
    expect(state.gameState.phase).toBe('moving');
    expect(state.gameState.rollValue).toBe(1);
    expect(state.validMoves.length).toBeGreaterThan(0);
  });

  it('offline roll() with no valid moves temporarily enters moving, then skips turn after timeout', () => {
    jest.useFakeTimers();
    mockedRollDice.mockReturnValue(0);

    useGameStore.getState().roll();

    let state = useGameStore.getState();
    expect(state.gameState.phase).toBe('moving');
    expect(state.gameState.rollValue).toBe(0);
    expect(state.validMoves).toEqual([]);

    jest.advanceTimersByTime(1000);

    state = useGameStore.getState();
    expect(state.gameState.currentTurn).toBe('dark');
    expect(state.gameState.phase).toBe('rolling');
    expect(state.gameState.rollValue).toBeNull();
    expect(state.validMoves).toEqual([]);
    expect(state.gameState.history[state.gameState.history.length - 1]).toBe('light rolled 0 but had no moves.');
  });

  it('offline roll() with no valid moves does not mutate the prior state history by reference', () => {
    jest.useFakeTimers();
    mockedRollDice.mockReturnValue(0);

    useGameStore.getState().roll();
    const movingState = useGameStore.getState().gameState;

    jest.advanceTimersByTime(1000);

    expect(movingState.history).toEqual([]);
    expect(useGameStore.getState().gameState.history).toEqual(['light rolled 0 but had no moves.']);
  });

  it('offline makeMove() in moving phase applies the move and clears validMoves', () => {
    const gameState = makeState({ phase: 'moving', rollValue: 1 });
    const validMove = engine.getValidMoves(gameState, 1)[0] as MoveAction;

    useGameStore.setState({ gameState, validMoves: [validMove] });
    useGameStore.getState().makeMove(validMove);

    const state = useGameStore.getState();
    expect(state.gameState.phase).toBe('rolling');
    expect(state.gameState.rollValue).toBeNull();
    expect(state.validMoves).toEqual([]);
  });

  it('in nakama mode, roll() does nothing when it is not the local player turn', () => {
    const sender = jest.fn();
    useGameStore.setState({
      onlineMode: 'nakama',
      playerColor: 'dark',
      gameState: makeState({ currentTurn: 'light', phase: 'rolling' }),
      rollCommandSender: sender,
    });

    useGameStore.getState().roll();

    expect(sender).not.toHaveBeenCalled();
  });

  it('in nakama mode, roll() delegates to rollCommandSender when local player turn', () => {
    const sender = jest.fn();
    useGameStore.setState({
      onlineMode: 'nakama',
      playerColor: 'light',
      gameState: makeState({ currentTurn: 'light', phase: 'rolling' }),
      rollCommandSender: sender,
    });

    useGameStore.getState().roll();

    expect(sender).toHaveBeenCalledTimes(1);
    expect(sender).toHaveBeenCalledWith(undefined);
  });

  it('in nakama mode, roll() passes through auto-trigger metadata when provided', () => {
    const sender = jest.fn();
    useGameStore.setState({
      onlineMode: 'nakama',
      playerColor: 'light',
      gameState: makeState({ currentTurn: 'light', phase: 'rolling' }),
      rollCommandSender: sender,
    });

    useGameStore.getState().roll({ autoTriggered: true });

    expect(sender).toHaveBeenCalledTimes(1);
    expect(sender).toHaveBeenCalledWith({ autoTriggered: true });
  });

  it('in nakama mode, makeMove() does nothing when it is not the local player turn', () => {
    const sender = jest.fn();
    useGameStore.setState({
      onlineMode: 'nakama',
      playerColor: 'dark',
      gameState: makeState({ currentTurn: 'light', phase: 'moving', rollValue: 1 }),
      moveCommandSender: sender,
    });

    useGameStore.getState().makeMove({ pieceId: 'light-0', fromIndex: -1, toIndex: 0 });

    expect(sender).not.toHaveBeenCalled();
  });

  it('in nakama mode, makeMove() delegates to moveCommandSender when local player turn', () => {
    const sender = jest.fn();
    const move = { pieceId: 'light-0', fromIndex: -1, toIndex: 0 };

    useGameStore.setState({
      onlineMode: 'nakama',
      playerColor: 'light',
      gameState: makeState({ currentTurn: 'light', phase: 'moving', rollValue: 1 }),
      moveCommandSender: sender,
    });

    useGameStore.getState().makeMove(move);

    expect(sender).toHaveBeenCalledWith(move);
  });

  it('reset() clears transport/session/match state and restores offline defaults', () => {
    useGameStore.setState({
      matchId: 'm-1',
      matchToken: 't-1',
      matchPresences: ['u-1'],
      lastProgressionAward: {
        matchId: 'm-1',
        source: 'pvp_win',
        duplicate: false,
        awardedXp: 100,
        previousTotalXp: 0,
        newTotalXp: 100,
        previousRank: 'Laborer',
        newRank: 'Servant of the Temple',
        rankChanged: true,
        progression: {
          totalXp: 100,
          currentRank: 'Servant of the Temple',
          currentRankThreshold: 100,
          nextRank: 'Apprentice Scribe',
          nextRankThreshold: 250,
          xpIntoCurrentRank: 0,
          xpNeededForNextRank: 150,
          progressPercent: 0,
        },
      },
      lastEloRatingChange: {
        type: 'elo_rating_update',
        leaderboardId: 'elo_global',
        matchId: 'm-1',
        duplicate: false,
        player: {
          userId: 'user-1',
          usernameDisplay: 'Michel',
          oldRating: 1200,
          newRating: 1216,
          delta: 16,
          provisional: true,
          ratedGames: 1,
          ratedWins: 1,
          ratedLosses: 0,
          rank: 42,
        },
        opponent: {
          userId: 'user-2',
          usernameDisplay: 'RoyalTwo',
          oldRating: 1200,
          newRating: 1184,
          delta: -16,
          provisional: true,
          ratedGames: 1,
          ratedWins: 0,
          ratedLosses: 1,
          rank: 43,
        },
      },
      socketState: 'connected',
      rollCommandSender: jest.fn(),
      moveCommandSender: jest.fn(),
      playerColor: 'dark',
      botDifficulty: 'perfect',
      onlineMode: 'nakama',
      serverRevision: 9,
      authoritativeServerTimeMs: 5_000,
      authoritativeTurnDurationMs: 10_000,
      authoritativeTurnStartedAtMs: 1_000,
      authoritativeTurnDeadlineMs: 11_000,
      authoritativeTurnRemainingMs: 6_000,
      authoritativeActiveTimedPlayer: 'dark-user',
      authoritativeActiveTimedPlayerColor: 'dark',
      authoritativeActiveTimedPhase: 'moving',
      authoritativePlayers: {
        light: { userId: 'light-user', title: 'Michel' },
        dark: { userId: 'dark-user', title: 'Guest' },
      },
      authoritativeAfkAccumulatedMs: { light: 10_000, dark: 20_000 },
      authoritativeAfkRemainingMs: 70_000,
      authoritativeReconnectingPlayer: 'dark-user',
      authoritativeReconnectingPlayerColor: 'dark',
      authoritativeReconnectGraceDurationMs: 15_000,
      authoritativeReconnectDeadlineMs: 24_000,
      authoritativeReconnectRemainingMs: 15_000,
      authoritativeMatchEnd: {
        reason: 'forfeit_inactivity',
        winnerUserId: 'light-user',
        loserUserId: 'dark-user',
        forfeitingUserId: 'dark-user',
        message: null,
      },
      authoritativeSnapshotReceivedAtMs: 9_000,
      nakamaSession: { token: 'token' } as never,
      userId: 'user-1',
      validMoves: [{ pieceId: 'light-1', fromIndex: -1, toIndex: 2 }],
      gameState: makeState({ phase: 'moving', rollValue: 2 }),
    });

    useGameStore.getState().reset();

    const state = useGameStore.getState();
    expect(state.matchId).toBeNull();
    expect(state.matchToken).toBeNull();
    expect(state.matchPresences).toEqual([]);
    expect(state.authoritativeServerTimeMs).toBeNull();
    expect(state.authoritativeTurnDurationMs).toBeNull();
    expect(state.authoritativeTurnStartedAtMs).toBeNull();
    expect(state.authoritativeTurnDeadlineMs).toBeNull();
    expect(state.authoritativeTurnRemainingMs).toBeNull();
    expect(state.authoritativeActiveTimedPlayer).toBeNull();
    expect(state.authoritativeActiveTimedPlayerColor).toBeNull();
    expect(state.authoritativeActiveTimedPhase).toBeNull();
    expect(state.authoritativePlayers).toBeNull();
    expect(state.authoritativeAfkAccumulatedMs).toBeNull();
    expect(state.authoritativeAfkRemainingMs).toBeNull();
    expect(state.authoritativeReconnectingPlayer).toBeNull();
    expect(state.authoritativeReconnectingPlayerColor).toBeNull();
    expect(state.authoritativeReconnectGraceDurationMs).toBeNull();
    expect(state.authoritativeReconnectDeadlineMs).toBeNull();
    expect(state.authoritativeReconnectRemainingMs).toBeNull();
    expect(state.authoritativeMatchEnd).toBeNull();
    expect(state.authoritativeSnapshotReceivedAtMs).toBeNull();
    expect(state.lastProgressionAward).toBeNull();
    expect(state.lastEloRatingChange).toBeNull();
    expect(state.socketState).toBe('idle');
    expect(state.rollCommandSender).toBeNull();
    expect(state.moveCommandSender).toBeNull();
    expect(state.playerColor).toBeNull();
    expect(state.botDifficulty).toBe('easy');
    expect(state.onlineMode).toBe('offline');
    expect(state.serverRevision).toBe(0);
    expect(state.nakamaSession).toBeNull();
    expect(state.userId).toBeNull();
    expect(state.validMoves).toEqual([]);
    expect(state.gameState).toEqual(engine.createInitialState());
  });
});

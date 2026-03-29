jest.mock('./elo', () => {
  const actual = jest.requireActual('./elo');
  return {
    ...actual,
    getEloRatingProfileForUser: jest.fn(() => ({
      leaderboardId: 'elo_global',
      userId: 'user-light',
      usernameDisplay: 'Light Player',
      eloRating: 1216,
      ratedGames: 11,
      ratedWins: 7,
      ratedLosses: 4,
      provisional: false,
      rank: 8,
      lastRatedMatchId: 'match-1',
      lastRatedAt: '2026-03-29T18:39:00.000Z',
    })),
    processRankedMatchResult: jest.fn(),
  };
});

jest.mock('./progression', () => {
  const actual = jest.requireActual('./progression');
  const { buildProgressionSnapshot } = jest.requireActual('../../shared/progression');
  return {
    ...actual,
    awardXpForMatchWin: jest.fn(() => ({ duplicate: true })),
    getProgressionForUser: jest.fn(() => buildProgressionSnapshot(200)),
  };
});

jest.mock('./challenges', () => {
  const actual = jest.requireActual('./challenges');
  const { createDefaultUserChallengeProgressSnapshot } = jest.requireActual('../../shared/challenges');
  return {
    ...actual,
    getUserChallengeProgress: jest.fn(() =>
      createDefaultUserChallengeProgressSnapshot('2026-03-29T18:39:00.000Z'),
    ),
    processCompletedMatch: jest.fn(() => ({
      duplicate: false,
      completedChallengeIds: [],
      awardedXp: 0,
      totalXp: 200,
      progressionRank: 'Beginner',
    })),
  };
});

jest.mock('./tournaments/matchResults', () => {
  const actual = jest.requireActual('./tournaments/matchResults');
  return {
    ...actual,
    processCompletedAuthoritativeTournamentMatch: jest.fn(),
  };
});

import { MatchOpCode } from '../../shared/urMatchProtocol';
import { processCompletedMatch } from './challenges';
import { processRankedMatchResult } from './elo';
import './index';
import { awardXpForMatchWin } from './progression';
import { processCompletedAuthoritativeTournamentMatch } from './tournaments/matchResults';

type RuntimeGlobals = typeof globalThis & {
  matchInit: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    params: Record<string, unknown>
  ) => { state: any; tickRate: number; label: string };
  matchLoop: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    messages: Array<Record<string, unknown>>
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
};

const mockedProcessCompletedMatch = processCompletedMatch as jest.MockedFunction<typeof processCompletedMatch>;
const mockedProcessRankedMatchResult = processRankedMatchResult as jest.MockedFunction<typeof processRankedMatchResult>;
const mockedAwardXpForMatchWin = awardXpForMatchWin as jest.MockedFunction<typeof awardXpForMatchWin>;
const mockedProcessCompletedAuthoritativeTournamentMatch =
  processCompletedAuthoritativeTournamentMatch as jest.MockedFunction<typeof processCompletedAuthoritativeTournamentMatch>;

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

const buildRatedResult = (duplicate: boolean): NonNullable<ReturnType<typeof processRankedMatchResult>> => ({
  duplicate,
  leaderboardId: 'elo_global',
  matchId: 'match-1',
  ranksByUserId: {
    'user-light': 8,
    'user-dark': 12,
  },
  playerResults: [
    {
      userId: 'user-light',
      usernameDisplay: 'Light Player',
      oldRating: 1200,
      newRating: 1216,
      delta: 16,
      ratedGames: 11,
      ratedWins: 7,
      ratedLosses: 4,
      provisional: false,
      lastRatedMatchId: 'match-1',
      lastRatedAt: '2026-03-29T18:39:00.000Z',
    },
    {
      userId: 'user-dark',
      usernameDisplay: 'Dark Player',
      oldRating: 1200,
      newRating: 1184,
      delta: -16,
      ratedGames: 11,
      ratedWins: 6,
      ratedLosses: 5,
      provisional: false,
      lastRatedMatchId: 'match-1',
      lastRatedAt: '2026-03-29T18:39:00.000Z',
    },
  ],
  record: {
    matchId: 'match-1',
    leaderboardId: 'elo_global',
    processedAt: '2026-03-29T18:39:00.000Z',
    winnerUserId: 'user-light',
    loserUserId: 'user-dark',
    playerResults: [
      {
        userId: 'user-light',
        usernameDisplay: 'Light Player',
        oldRating: 1200,
        newRating: 1216,
        delta: 16,
        ratedGames: 11,
        ratedWins: 7,
        ratedLosses: 4,
        provisional: false,
        lastRatedMatchId: 'match-1',
        lastRatedAt: '2026-03-29T18:39:00.000Z',
      },
      {
        userId: 'user-dark',
        usernameDisplay: 'Dark Player',
        oldRating: 1200,
        newRating: 1184,
        delta: -16,
        ratedGames: 11,
        ratedWins: 6,
        ratedLosses: 5,
        provisional: false,
        lastRatedMatchId: 'match-1',
        lastRatedAt: '2026-03-29T18:39:00.000Z',
      },
    ],
  },
});

const attachPresences = (state: any) => {
  state.started = true;
  state.presences = {
    'user-light': {
      'light-session': {
        userId: 'user-light',
        sessionId: 'light-session',
        node: 'node-1',
      },
    },
    'user-dark': {
      'dark-session': {
        userId: 'user-dark',
        sessionId: 'dark-session',
        node: 'node-1',
      },
    },
  };

  return state;
};

describe('tournament match result synchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedProcessCompletedMatch.mockReturnValue({
      duplicate: false,
      completedChallengeIds: [],
      awardedXp: 0,
      totalXp: 200,
      progressionRank: 'Beginner',
    });
    mockedAwardXpForMatchWin.mockReturnValue({
      matchId: 'match-1',
      source: 'pvp_win',
      duplicate: true,
      awardedXp: 100,
      previousTotalXp: 100,
      newTotalXp: 200,
      previousRank: 'Laborer',
      newRank: 'Laborer',
      rankChanged: false,
      progression: {
        totalXp: 200,
        currentRank: 'Laborer',
        currentRankThreshold: 0,
        nextRank: 'Servant of the Temple',
        nextRankThreshold: 100,
        xpIntoCurrentRank: 200,
        xpNeededForNextRank: 0,
        progressPercent: 100,
      },
    });
  });

  it('treats tournament matches as ranked even for alternate board modes', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const ctx = { matchId: 'match-variant' };

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['user-light', 'user-dark'],
      modeId: 'gameMode_1_piece',
      rankedMatch: true,
      tournamentRunId: 'run-1',
      tournamentId: 'tour-1',
      tournamentRound: 1,
      tournamentEntryId: 'entry-1',
    });

    expect(initialized.state.classification).toEqual(
      expect.objectContaining({
        ranked: true,
        experimental: false,
      }),
    );
  });

  it('retries tournament result processing on later ticks without rebroadcasting duplicate Elo updates', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-1' };

    mockedProcessRankedMatchResult.mockReturnValueOnce(buildRatedResult(false)).mockReturnValueOnce(buildRatedResult(true));

    mockedProcessCompletedAuthoritativeTournamentMatch
      .mockReturnValueOnce(null as never)
      .mockReturnValueOnce({
        skipped: false,
        duplicate: false,
        record: null,
        updatedRun: null,
        participantResolutions: [
          {
            userId: 'user-light',
            state: 'champion',
            finalPlacement: 1,
          },
          {
            userId: 'user-dark',
            state: 'runner_up',
            finalPlacement: 2,
          },
        ],
        finalizationResult: {
          run: {} as never,
          standings: [],
          championUserId: 'user-light',
          championRewardResult: null,
        },
      } as ReturnType<typeof processCompletedAuthoritativeTournamentMatch>);

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['user-light', 'user-dark'],
      modeId: 'standard',
      rankedMatch: true,
      tournamentRunId: 'run-1',
      tournamentId: 'tour-1',
      tournamentRound: 1,
      tournamentEntryId: 'round-1-match-1',
    });

    let state = attachPresences(initialized.state);
    state.gameState = {
      ...state.gameState,
      phase: 'ended',
      winner: 'light',
    };

    state = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, []).state;

    expect(state.resultRecorded).toBe(false);
    expect(mockedProcessCompletedAuthoritativeTournamentMatch).toHaveBeenCalledTimes(1);
    expect(
      dispatcher.broadcastMessage.mock.calls.filter(([opCode]) => opCode === MatchOpCode.ELO_RATING_UPDATE),
    ).toHaveLength(2);
    expect(
      dispatcher.broadcastMessage.mock.calls.filter(([opCode]) => opCode === MatchOpCode.TOURNAMENT_REWARD_SUMMARY),
    ).toHaveLength(0);

    state = runtime.matchLoop(ctx, logger, nk, dispatcher, 2, state, []).state;

    expect(state.resultRecorded).toBe(true);
    expect(mockedProcessCompletedAuthoritativeTournamentMatch).toHaveBeenCalledTimes(2);
    expect(
      dispatcher.broadcastMessage.mock.calls.filter(([opCode]) => opCode === MatchOpCode.ELO_RATING_UPDATE),
    ).toHaveLength(2);
    expect(
      dispatcher.broadcastMessage.mock.calls.filter(([opCode]) => opCode === MatchOpCode.TOURNAMENT_REWARD_SUMMARY),
    ).toHaveLength(2);
  });

  it('marks final-match summaries as champion and runner-up when finalization succeeds before participant states catch up', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-final' };

    mockedProcessRankedMatchResult.mockReturnValueOnce(buildRatedResult(false));
    mockedProcessCompletedAuthoritativeTournamentMatch.mockReturnValueOnce({
      skipped: false,
      duplicate: false,
      record: null,
      updatedRun: null,
      participantResolutions: [
        {
          userId: 'user-light',
          state: 'waiting_next_round',
          finalPlacement: null,
        },
        {
          userId: 'user-dark',
          state: 'eliminated',
          finalPlacement: 2,
        },
      ],
      finalizationResult: {
        run: {
          lifecycle: 'finalized',
        } as never,
        finalSnapshot: {
          generatedAt: '2026-03-29T18:39:00.000Z',
          overrideExpiry: 0,
          rankCount: 2,
          records: [],
          prevCursor: null,
          nextCursor: null,
        },
        championUserId: 'user-light',
        championRewardResult: null,
        disabledRanks: true,
        nakamaTournament: null,
      },
    } as ReturnType<typeof processCompletedAuthoritativeTournamentMatch>);

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['user-light', 'user-dark'],
      modeId: 'standard',
      rankedMatch: true,
      tournamentRunId: 'run-1',
      tournamentId: 'tour-1',
      tournamentRound: 1,
      tournamentEntryId: 'round-1-match-1',
    });

    const state = attachPresences({
      ...initialized.state,
      gameState: {
        ...initialized.state.gameState,
        phase: 'ended',
        winner: 'light',
      },
    });

    runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, []);

    const rewardSummaryPayloads = dispatcher.broadcastMessage.mock.calls
      .filter(([opCode]) => opCode === MatchOpCode.TOURNAMENT_REWARD_SUMMARY)
      .map(([, payload]) => JSON.parse(payload as string)) as Array<{
        playerUserId: string;
        tournamentOutcome: string;
        shouldEnterWaitingRoom: boolean;
      }>;

    expect(rewardSummaryPayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          playerUserId: 'user-light',
          tournamentOutcome: 'champion',
          shouldEnterWaitingRoom: false,
        }),
        expect.objectContaining({
          playerUserId: 'user-dark',
          tournamentOutcome: 'runner_up',
          shouldEnterWaitingRoom: false,
        }),
      ]),
    );
  });

  it('marks final-match summaries as champion and runner-up when the final round completes before participant states catch up', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-final-stale-participant-state' };

    mockedProcessRankedMatchResult.mockReturnValueOnce(buildRatedResult(false));
    mockedProcessCompletedAuthoritativeTournamentMatch.mockReturnValueOnce({
      skipped: false,
      duplicate: false,
      record: {
        counted: true,
        summary: {
          round: 1,
        },
      },
      updatedRun: {
        bracket: {
          totalRounds: 1,
        },
      },
      participantResolutions: [
        {
          userId: 'user-light',
          state: 'waiting_next_round',
          finalPlacement: null,
        },
        {
          userId: 'user-dark',
          state: 'eliminated',
          finalPlacement: 2,
        },
      ],
      finalizationResult: null,
    } as ReturnType<typeof processCompletedAuthoritativeTournamentMatch>);

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['user-light', 'user-dark'],
      modeId: 'standard',
      rankedMatch: true,
      tournamentRunId: 'run-1',
      tournamentId: 'tour-1',
      tournamentRound: 1,
      tournamentEntryId: 'round-1-match-1',
    });

    const state = attachPresences({
      ...initialized.state,
      gameState: {
        ...initialized.state.gameState,
        phase: 'ended',
        winner: 'light',
      },
    });

    runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, []);

    const rewardSummaryPayloads = dispatcher.broadcastMessage.mock.calls
      .filter(([opCode]) => opCode === MatchOpCode.TOURNAMENT_REWARD_SUMMARY)
      .map(([, payload]) => JSON.parse(payload as string)) as Array<{
        playerUserId: string;
        tournamentOutcome: string;
        shouldEnterWaitingRoom: boolean;
      }>;

    expect(rewardSummaryPayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          playerUserId: 'user-light',
          tournamentOutcome: 'champion',
          shouldEnterWaitingRoom: false,
        }),
        expect.objectContaining({
          playerUserId: 'user-dark',
          tournamentOutcome: 'runner_up',
          shouldEnterWaitingRoom: false,
        }),
      ]),
    );
  });

  it('retries tournament synchronization when a finished player leaves the match', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-leave-retry' };

    mockedProcessRankedMatchResult.mockReturnValueOnce(buildRatedResult(false)).mockReturnValueOnce(buildRatedResult(true));
    mockedProcessCompletedAuthoritativeTournamentMatch
      .mockReturnValueOnce(null as never)
      .mockReturnValueOnce({
        skipped: false,
        duplicate: false,
        record: null,
        updatedRun: null,
        participantResolutions: [
          {
            userId: 'user-light',
            state: 'champion',
            finalPlacement: 1,
          },
          {
            userId: 'user-dark',
            state: 'runner_up',
            finalPlacement: 2,
          },
        ],
        finalizationResult: {
          run: {
            lifecycle: 'finalized',
          } as never,
          finalSnapshot: {
            generatedAt: '2026-03-29T18:39:00.000Z',
            overrideExpiry: 0,
            rankCount: 2,
            records: [],
            prevCursor: null,
            nextCursor: null,
          },
          championUserId: 'user-light',
          championRewardResult: null,
          disabledRanks: true,
          nakamaTournament: null,
        },
      } as ReturnType<typeof processCompletedAuthoritativeTournamentMatch>);

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['user-light', 'user-dark'],
      modeId: 'standard',
      rankedMatch: true,
      tournamentRunId: 'run-1',
      tournamentId: 'tour-1',
      tournamentRound: 1,
      tournamentEntryId: 'round-1-match-1',
    });

    let state = attachPresences({
      ...initialized.state,
      gameState: {
        ...initialized.state.gameState,
        phase: 'ended',
        winner: 'light',
      },
    });

    state = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, []).state;
    expect(state.resultRecorded).toBe(false);

    state = runtime.matchLeave(
      ctx,
      logger,
      nk,
      dispatcher,
      2,
      state,
      [
        {
          userId: 'user-light',
          sessionId: 'light-session',
          node: 'node-1',
        },
      ],
    ).state;

    expect(state.resultRecorded).toBe(true);
    expect(mockedProcessCompletedAuthoritativeTournamentMatch).toHaveBeenCalledTimes(2);
  });

  it('processes public matchmaking wins through Elo, XP, and challenge rewards', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-1' };

    mockedProcessRankedMatchResult.mockReturnValueOnce(buildRatedResult(false));

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['user-light', 'user-dark'],
      modeId: 'standard',
      rankedMatch: true,
      casualMatch: false,
      botMatch: false,
      privateMatch: false,
      winRewardSource: 'pvp_win',
      allowsChallengeRewards: true,
    });

    const state = attachPresences({
      ...initialized.state,
      gameState: {
        ...initialized.state.gameState,
        phase: 'ended',
        winner: 'light',
      },
    });

    runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, []);

    expect(mockedProcessRankedMatchResult).toHaveBeenCalledWith(
      nk,
      logger,
      expect.objectContaining({
        matchId: 'match-1',
        privateMatch: false,
        ranked: true,
      }),
    );
    expect(mockedAwardXpForMatchWin).toHaveBeenCalledWith(
      nk,
      logger,
      expect.objectContaining({
        matchId: 'match-1',
        source: 'pvp_win',
        userId: 'user-light',
      }),
    );
    expect(mockedProcessCompletedMatch).toHaveBeenCalledTimes(2);
    expect(
      dispatcher.broadcastMessage.mock.calls.filter(([opCode]) => opCode === MatchOpCode.ELO_RATING_UPDATE),
    ).toHaveLength(2);
  });

  it('processes standard private wins through Elo, reduced XP, and challenge rewards', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-1' };

    mockedProcessRankedMatchResult.mockReturnValueOnce(buildRatedResult(false));

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['user-light', 'user-dark'],
      modeId: 'standard',
      rankedMatch: true,
      casualMatch: false,
      botMatch: false,
      privateMatch: true,
      privateCode: 'ABCDEFGH',
      winRewardSource: 'private_pvp_win',
      allowsChallengeRewards: true,
    });

    const state = attachPresences({
      ...initialized.state,
      gameState: {
        ...initialized.state.gameState,
        phase: 'ended',
        winner: 'light',
      },
    });

    runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, []);

    expect(mockedProcessRankedMatchResult).toHaveBeenCalledWith(
      nk,
      logger,
      expect.objectContaining({
        matchId: 'match-1',
        privateMatch: true,
        ranked: true,
      }),
    );
    expect(mockedAwardXpForMatchWin).toHaveBeenCalledWith(
      nk,
      logger,
      expect.objectContaining({
        matchId: 'match-1',
        source: 'private_pvp_win',
        userId: 'user-light',
      }),
    );
    expect(mockedProcessCompletedMatch).toHaveBeenCalledTimes(2);
    expect(
      dispatcher.broadcastMessage.mock.calls.filter(([opCode]) => opCode === MatchOpCode.ELO_RATING_UPDATE),
    ).toHaveLength(2);
  });

  it('keeps alternate private rulesets on the XP and challenge path without applying Elo', () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const ctx = { matchId: 'match-variant-private' };

    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['user-light', 'user-dark'],
      modeId: 'gameMode_1_piece',
      rankedMatch: false,
      casualMatch: false,
      botMatch: false,
      privateMatch: true,
      privateCode: 'ABCDEFGH',
      winRewardSource: 'private_pvp_win',
      allowsChallengeRewards: true,
    });

    const state = attachPresences({
      ...initialized.state,
      gameState: {
        ...initialized.state.gameState,
        phase: 'ended',
        winner: 'light',
      },
    });

    runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, []);

    expect(mockedProcessRankedMatchResult).toHaveBeenCalledWith(
      nk,
      logger,
      expect.objectContaining({
        matchId: 'match-variant-private',
        privateMatch: true,
        ranked: false,
        experimentalMode: true,
      }),
    );
    expect(mockedAwardXpForMatchWin).toHaveBeenCalledWith(
      nk,
      logger,
      expect.objectContaining({
        matchId: 'match-variant-private',
        source: 'private_pvp_win',
        userId: 'user-light',
      }),
    );
    expect(mockedProcessCompletedMatch).toHaveBeenCalledTimes(2);
    expect(
      dispatcher.broadcastMessage.mock.calls.filter(([opCode]) => opCode === MatchOpCode.ELO_RATING_UPDATE),
    ).toHaveLength(0);
  });
});

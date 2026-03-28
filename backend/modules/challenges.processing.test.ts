import {
  CHALLENGE_DEFINITIONS,
  CHALLENGE_IDS,
  ChallengeId,
  CompletedMatchSummary,
  createDefaultUserChallengeProgressSnapshot,
} from "../../shared/challenges";
import { createDefaultProgressionProfile } from "../../shared/progression";
import { ensureUserChallengeProgress, getUserChallengeProgress, processCompletedMatch } from "./challenges";

type StoredObject = {
  collection: string;
  key: string;
  userId?: string;
  value: unknown;
  version: string;
};

type StorageReadRequest = {
  collection: string;
  key: string;
  userId?: string;
};

type StorageWriteRequest = {
  collection: string;
  key: string;
  userId?: string;
  value: unknown;
  version?: string;
};

const PROGRESSION_COLLECTION = "progression";
const PROGRESSION_PROFILE_KEY = "profile";
const USER_CHALLENGE_PROGRESS_COLLECTION = "user_challenge_progress";
const USER_CHALLENGE_PROGRESS_KEY = "progress";

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const buildStorageKey = (collection: string, key: string, userId = ""): string =>
  `${collection}:${key}:${userId}`;

const createNakama = () => {
  const storage = new Map<string, StoredObject>();
  let versionCounter = 1;

  const storageRead = jest.fn((requests: StorageReadRequest[]) =>
    requests
      .map((request) => storage.get(buildStorageKey(request.collection, request.key, request.userId ?? "")))
      .filter((object): object is StoredObject => Boolean(object))
  );

  const storageWrite = jest.fn((writes: StorageWriteRequest[]) => {
    writes.forEach((write) => {
      const storageKey = buildStorageKey(write.collection, write.key, write.userId ?? "");
      const existing = storage.get(storageKey);
      const version = write.version ?? "";

      if (version === "" && existing) {
        throw new Error(`Storage object already exists for ${storageKey}`);
      }

      if (version !== "" && version !== "*" && (!existing || existing.version !== version)) {
        throw new Error(`Storage version mismatch for ${storageKey}`);
      }

      storage.set(storageKey, {
        collection: write.collection,
        key: write.key,
        userId: write.userId,
        value: write.value,
        version: `v${versionCounter++}`,
      });
    });
  });

  return {
    storage,
    storageRead,
    storageWrite,
  };
};

const seedProgressionProfile = (
  nk: ReturnType<typeof createNakama>,
  userId: string,
  totalXp: number,
): void => {
  nk.storage.set(buildStorageKey(PROGRESSION_COLLECTION, PROGRESSION_PROFILE_KEY, userId), {
    collection: PROGRESSION_COLLECTION,
    key: PROGRESSION_PROFILE_KEY,
    userId,
    value: createDefaultProgressionProfile(totalXp, "2026-03-28T10:00:00.000Z"),
    version: "seed-profile-1",
  });
};

const seedChallengeProgress = (
  nk: ReturnType<typeof createNakama>,
  userId: string,
  value: unknown,
): void => {
  nk.storage.set(buildStorageKey(USER_CHALLENGE_PROGRESS_COLLECTION, USER_CHALLENGE_PROGRESS_KEY, userId), {
    collection: USER_CHALLENGE_PROGRESS_COLLECTION,
    key: USER_CHALLENGE_PROGRESS_KEY,
    userId,
    value,
    version: "seed-progress-1",
  });
};

const createSummary = (overrides: Partial<CompletedMatchSummary> = {}): CompletedMatchSummary => ({
  matchId: "match-1",
  playerUserId: "user-1",
  opponentType: "human",
  opponentDifficulty: null,
  didWin: true,
  totalMoves: 48,
  playerMoveCount: 24,
  playerTurnCount: 24,
  opponentTurnCount: 23,
  piecesLost: 0,
  maxRollCount: 1,
  unusableRollCount: 1,
  capturesMade: 1,
  capturesSuffered: 0,
  captureTurnNumbers: [5],
  maxCaptureTurnStreak: 1,
  doubleStrikeAchieved: false,
  relentlessPressureAchieved: false,
  contestedTilesLandedCount: 1,
  opponentStartingAreaExitTurn: 2,
  lockdownAchieved: false,
  borneOffCount: 7,
  opponentBorneOffCount: 3,
  wasBehindDuringMatch: false,
  behindCheckpointCount: 0,
  behindReasons: [],
  opponentReachedBrink: false,
  momentumShiftAchieved: false,
  momentumShiftTurnSpan: null,
  maxActivePiecesOnBoard: 3,
  modeId: "standard",
  pieceCountPerSide: 7,
  isPrivateMatch: false,
  isFriendMatch: false,
  isTournamentMatch: false,
  tournamentEliminationRisk: false,
  timestamp: "2026-03-28T12:00:00.000Z",
  ...overrides,
});

describe("challenge progression processing", () => {
  it("tracks daily grinder and cumulative win streak progress across matches", () => {
    const nk = createNakama();
    const logger = createLogger();

    processCompletedMatch(nk, logger, createSummary({ matchId: "match-1", timestamp: "2026-03-28T08:00:00.000Z" }));
    processCompletedMatch(nk, logger, createSummary({ matchId: "match-2", timestamp: "2026-03-28T10:00:00.000Z" }));
    const third = processCompletedMatch(
      nk,
      logger,
      createSummary({ matchId: "match-3", timestamp: "2026-03-28T12:00:00.000Z" })
    );

    expect(third.completedChallengeIds).toEqual(
      expect.arrayContaining([
        CHALLENGE_IDS.DAILY_GRINDER,
        CHALLENGE_IDS.WINNING_STREAK_I,
      ])
    );

    const progress = getUserChallengeProgress(nk, logger, "user-1");
    expect(progress.stats.dailyGameCount).toBe(3);
    expect(progress.stats.currentWinStreak).toBe(3);
    expect(progress.challenges[CHALLENGE_IDS.DAILY_GRINDER].completed).toBe(true);
    expect(progress.challenges[CHALLENGE_IDS.WINNING_STREAK_I].completed).toBe(true);
  });

  it("resets the win streak on a loss while keeping tournament streaks separate from normal matches", () => {
    const nk = createNakama();
    const logger = createLogger();

    processCompletedMatch(nk, logger, createSummary({ matchId: "match-win-1" }));
    processCompletedMatch(nk, logger, createSummary({ matchId: "match-loss", didWin: false, timestamp: "2026-03-29T12:00:00.000Z" }));
    processCompletedMatch(
      nk,
      logger,
      createSummary({
        matchId: "tournament-win",
        isTournamentMatch: true,
        tournamentEliminationRisk: true,
        timestamp: "2026-03-30T12:00:00.000Z",
      })
    );
    processCompletedMatch(nk, logger, createSummary({ matchId: "normal-win", timestamp: "2026-03-31T12:00:00.000Z" }));

    const progress = getUserChallengeProgress(nk, logger, "user-1");
    expect(progress.stats.currentWinStreak).toBe(2);
    expect(progress.stats.currentTournamentWinStreak).toBe(1);
  });

  it("awards veteran tiers from persisted lifetime counters", () => {
    const nk = createNakama();
    const logger = createLogger();
    const progress = createDefaultUserChallengeProgressSnapshot("2026-03-28T09:00:00.000Z");
    progress.stats.totalGamesPlayed = 249;
    seedChallengeProgress(nk, "user-1", progress);

    const result = processCompletedMatch(nk, logger, createSummary({ matchId: "match-veteran" }));

    expect(result.completedChallengeIds).toEqual(
      expect.arrayContaining([
        CHALLENGE_IDS.VETERAN_I,
        CHALLENGE_IDS.VETERAN_II,
        CHALLENGE_IDS.VETERAN_III,
      ])
    );
  });

  it("awards Eternal when the current progression profile is already at Immortal on match processing", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedProgressionProfile(nk, "user-1", 40000);

    const result = processCompletedMatch(nk, logger, createSummary({ matchId: "match-immortal" }));

    expect(result.completedChallengeIds).toContain(CHALLENGE_IDS.ETERNAL);
  });

  it("awards Perfectionist once every other challenge is already complete", () => {
    const nk = createNakama();
    const logger = createLogger();
    const progress = createDefaultUserChallengeProgressSnapshot("2026-03-28T09:00:00.000Z");

    CHALLENGE_DEFINITIONS.forEach((definition) => {
      if (definition.id === CHALLENGE_IDS.PERFECTIONIST) {
        return;
      }

      progress.challenges[definition.id] = {
        ...progress.challenges[definition.id],
        completed: true,
        completedAt: "2026-03-28T09:00:00.000Z",
        completedMatchId: "seeded-match",
      };
    });
    progress.totalCompleted = CHALLENGE_DEFINITIONS.length - 1;
    progress.totalRewardedXp = CHALLENGE_DEFINITIONS
      .filter((definition) => definition.id !== CHALLENGE_IDS.PERFECTIONIST)
      .reduce((total, definition) => total + definition.rewardXp, 0);
    seedChallengeProgress(nk, "user-1", progress);

    const result = processCompletedMatch(nk, logger, createSummary({ matchId: "match-perfectionist" }));

    expect(result.completedChallengeIds).toContain(CHALLENGE_IDS.PERFECTIONIST);
  });

  it("awards tournament survivor from persisted tournament win streaks and clutch tournament from match context", () => {
    const nk = createNakama();
    const logger = createLogger();
    const progress = createDefaultUserChallengeProgressSnapshot("2026-03-28T09:00:00.000Z");
    progress.stats.currentTournamentWinStreak = 2;
    seedChallengeProgress(nk, "user-1", progress);

    const result = processCompletedMatch(
      nk,
      logger,
      createSummary({
        matchId: "match-tournament",
        isTournamentMatch: true,
        tournamentEliminationRisk: true,
      })
    );

    expect(result.completedChallengeIds).toEqual(
      expect.arrayContaining([
        CHALLENGE_IDS.TOURNAMENT_SURVIVOR,
        CHALLENGE_IDS.CLUTCH_TOURNAMENT,
      ])
    );
  });

  it("is idempotent and does not award XP twice for the same processed match", () => {
    const nk = createNakama();
    const logger = createLogger();

    const first = processCompletedMatch(
      nk,
      logger,
      createSummary({
        matchId: "match-duplicate",
        didWin: true,
        contestedTilesLandedCount: 0,
        capturesMade: 0,
        captureTurnNumbers: [],
        pieceCountPerSide: 1,
        modeId: "gameMode_1_piece",
        playerTurnCount: 8,
        maxActivePiecesOnBoard: 1,
        opponentType: "perfect_bot",
        opponentDifficulty: "perfect",
        capturesSuffered: 0,
        piecesLost: 0,
      })
    );
    const second = processCompletedMatch(
      nk,
      logger,
      createSummary({
        matchId: "match-duplicate",
        didWin: true,
        contestedTilesLandedCount: 0,
        capturesMade: 0,
        captureTurnNumbers: [],
        pieceCountPerSide: 1,
        modeId: "gameMode_1_piece",
        playerTurnCount: 8,
        maxActivePiecesOnBoard: 1,
        opponentType: "perfect_bot",
        opponentDifficulty: "perfect",
        capturesSuffered: 0,
        piecesLost: 0,
      })
    );

    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(second.awardedXp).toBe(first.awardedXp);
    expect(second.totalXp).toBe(first.totalXp);
  });

  it("repairs old saved challenge snapshots that are missing the new stats fields", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedChallengeProgress(nk, "user-1", {
      totalCompleted: 1,
      totalRewardedXp: 50,
      updatedAt: "2026-03-27T09:00:00.000Z",
      challenges: {
        [CHALLENGE_IDS.FIRST_VICTORY]: {
          challengeId: CHALLENGE_IDS.FIRST_VICTORY,
          completed: true,
          completedAt: "2026-03-27T09:00:00.000Z",
          completedMatchId: "legacy-match",
          rewardXp: 50,
        },
      },
    });

    const repaired = ensureUserChallengeProgress(nk, logger, "user-1");

    expect(repaired.challenges[CHALLENGE_IDS.FIRST_VICTORY].completed).toBe(true);
    expect(repaired.stats.totalGamesPlayed).toBe(0);
    expect(repaired.challenges[CHALLENGE_IDS.VETERAN_I].progressLabel).toBe("0/50 games played");
  });
});

import {
  processCompletedAuthoritativeTournamentMatch,
  resolveTournamentMatchContextFromParams,
  TOURNAMENT_MATCH_RESULTS_COLLECTION,
  TOURNAMENT_RUNS_COLLECTION,
  type AuthoritativeTournamentMatchCompletion,
} from "./matchResults";

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

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const buildStorageKey = (collection: string, key: string, userId = ""): string =>
  `${collection}:${key}:${userId}`;

const PROGRESSION_COLLECTION = "progression";
const PROGRESSION_PROFILE_KEY = "profile";
const XP_REWARD_LEDGER_COLLECTION = "xp_reward_ledger";

const createNakama = () => {
  const storage = new Map<string, StoredObject>();
  let versionCounter = 1;

  const storageRead = jest.fn((requests: StorageReadRequest[]) =>
    requests
      .map((request) => storage.get(buildStorageKey(request.collection, request.key, request.userId ?? "")))
      .filter((object): object is StoredObject => Boolean(object)),
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
    tournamentsGetId: jest.fn((_ids: string[]) => [] as Array<Record<string, unknown>>),
    usersGetId: jest.fn((userIds: string[]) =>
      userIds.map((userId) => ({
        userId,
        username: `user-${userId.slice(-4)}`,
      })),
    ),
    tournamentJoin: jest.fn(),
    tournamentRanksDisable: jest.fn(),
    tournamentRecordsList: jest.fn(() => ({
      records: [] as Array<Record<string, unknown>>,
      owner_records: [] as Array<Record<string, unknown>>,
      rank_count: 0,
    })),
    tournamentRecordWrite: jest.fn(
      (
        tournamentId: string,
        ownerId: string,
        username: string,
        score: number,
        subscore: number,
        metadata: Record<string, unknown>,
      ) => ({
        tournamentId,
        ownerId,
        username,
        score,
        subscore,
        metadata,
      }),
    ),
  };
};

const seedRun = (nk: ReturnType<typeof createNakama>, overrides: Record<string, unknown> = {}) => {
  nk.storage.set(buildStorageKey(TOURNAMENT_RUNS_COLLECTION, "run-1"), {
    collection: TOURNAMENT_RUNS_COLLECTION,
    key: "run-1",
    value: {
      runId: "run-1",
      tournamentId: "tour-1",
      title: "Spring Cup",
      description: "Season opener",
      category: 0,
      authoritative: true,
      sortOrder: "desc",
      resetSchedule: "",
      startTime: 1_774_572_800,
      endTime: 1_774_580_000,
      duration: 7_200,
      maxSize: 8,
      maxNumScore: 7,
      enableRanks: true,
      lifecycle: "open",
      operator: "incr",
      joinRequired: true,
      metadata: {},
      createdAt: "2026-03-26T10:00:00.000Z",
      updatedAt: "2026-03-26T10:00:00.000Z",
      createdByUserId: "admin-1",
      createdByLabel: "Admin",
      openedAt: "2026-03-26T10:05:00.000Z",
      closedAt: null,
      finalizedAt: null,
      finalSnapshot: null,
      ...overrides,
    },
    version: "run-version-1",
  });
};

const createCompletion = (overrides: Partial<AuthoritativeTournamentMatchCompletion> = {}): AuthoritativeTournamentMatchCompletion => ({
  matchId: "match-1",
  modeId: "standard",
  context: {
    runId: "run-1",
    tournamentId: "tour-1",
    round: 1,
    entryId: "round-1-match-1",
    eliminationRisk: true,
  },
  completedAt: "2026-03-26T11:00:00.000Z",
  totalMoves: 18,
  revision: 42,
  winningColor: "light",
  winnerUserId: "user-light",
  loserUserId: "user-dark",
  classification: {
    ranked: true,
    casual: false,
    private: false,
    bot: false,
    experimental: false,
  },
  players: [
    {
      userId: "user-light",
      username: "light-user",
      color: "light",
      didWin: true,
      score: 1,
      finishedCount: 7,
      capturesMade: 2,
      capturesSuffered: 0,
      playerMoveCount: 9,
    },
    {
      userId: "user-dark",
      username: "dark-user",
      color: "dark",
      didWin: false,
      score: 0,
      finishedCount: 4,
      capturesMade: 0,
      capturesSuffered: 2,
      playerMoveCount: 9,
    },
  ],
  ...overrides,
});

describe("tournament authoritative match results", () => {
  it("stores and counts valid tournament matches", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedRun(nk);

    const result = processCompletedAuthoritativeTournamentMatch(nk, logger, createCompletion());

    expect(result.skipped).toBe(false);
    expect(result.duplicate).toBe(false);
    expect(result.record?.valid).toBe(true);
    expect(result.record?.counted).toBe(true);
    expect(nk.tournamentJoin).toHaveBeenCalledTimes(2);
    expect(nk.tournamentRecordWrite).toHaveBeenCalledTimes(2);

    const storedResult = nk.storage.get(buildStorageKey(TOURNAMENT_MATCH_RESULTS_COLLECTION, "run-1:match-1"));
    expect(storedResult?.value).toEqual(
      expect.objectContaining({
        matchId: "match-1",
        runId: "run-1",
        tournamentId: "tour-1",
        valid: true,
        counted: true,
      }),
    );

    const storedRun = nk.storage.get(buildStorageKey(TOURNAMENT_RUNS_COLLECTION, "run-1"));
    expect(storedRun?.value).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          countedMatchCount: 1,
          lastProcessedMatchId: "match-1",
          lastProcessedWasCounted: true,
          lastWinnerUserId: "user-light",
        }),
      }),
    );
  });

  it("stores invalid tournament matches without counting them", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedRun(nk);

    const result = processCompletedAuthoritativeTournamentMatch(
      nk,
      logger,
      createCompletion({
        classification: {
          ranked: false,
          casual: false,
          private: true,
          bot: false,
          experimental: false,
        },
      }),
    );

    expect(result.record?.valid).toBe(false);
    expect(result.record?.counted).toBe(false);
    expect(result.record?.invalidReason).toBe("Private matches do not count toward tournaments.");
    expect(nk.tournamentJoin).not.toHaveBeenCalled();
    expect(nk.tournamentRecordWrite).not.toHaveBeenCalled();

    const storedRun = nk.storage.get(buildStorageKey(TOURNAMENT_RUNS_COLLECTION, "run-1"));
    expect(storedRun?.value).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          countedMatchCount: 0,
          lastProcessedWasCounted: false,
          lastProcessedReason: "Private matches do not count toward tournaments.",
        }),
      }),
    );
  });

  it("ignores duplicate tournament result processing", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedRun(nk);
    const completion = createCompletion();

    processCompletedAuthoritativeTournamentMatch(nk, logger, completion);
    const duplicate = processCompletedAuthoritativeTournamentMatch(nk, logger, completion);

    expect(duplicate.duplicate).toBe(true);
    expect(nk.tournamentRecordWrite).toHaveBeenCalledTimes(2);
  });

  it("auto-finalizes the tournament and awards champion XP after the deciding match", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedRun(nk, {
      metadata: {
        xpForTournamentChampion: 420,
      },
      maxSize: 2,
    });
    nk.tournamentsGetId.mockImplementation((ids: string[]) =>
      ids.includes("tour-1")
        ? [
            {
              id: "tour-1",
              size: 2,
              maxSize: 2,
            },
          ]
        : [],
    );
    nk.tournamentRecordsList.mockReturnValue({
      records: [
        {
          rank: 1,
          owner_id: "user-light",
          username: "light-user",
          score: 1,
        },
        {
          rank: 2,
          owner_id: "user-dark",
          username: "dark-user",
          score: 0,
        },
      ],
      owner_records: [],
      rank_count: 2,
    });

    const result = processCompletedAuthoritativeTournamentMatch(nk, logger, createCompletion());

    expect(result.record?.counted).toBe(true);
    expect(nk.tournamentRanksDisable).toHaveBeenCalledWith("tour-1");

    const storedRun = nk.storage.get(buildStorageKey(TOURNAMENT_RUNS_COLLECTION, "run-1"));
    expect(storedRun?.value).toEqual(
      expect.objectContaining({
        lifecycle: "finalized",
        finalSnapshot: expect.objectContaining({
          records: expect.arrayContaining([
            expect.objectContaining({
              rank: 1,
              owner_id: "user-light",
            }),
          ]),
        }),
      }),
    );

    const championProfile = nk.storage.get(
      buildStorageKey(PROGRESSION_COLLECTION, PROGRESSION_PROFILE_KEY, "user-light"),
    )?.value as { totalXp: number } | undefined;
    const championLedger = nk.storage.get(
      buildStorageKey(XP_REWARD_LEDGER_COLLECTION, "tournament_champion:run-1", "user-light"),
    )?.value as { awardedXp: number; source: string; sourceId: string } | undefined;

    expect(championProfile?.totalXp).toBe(420);
    expect(championLedger).toEqual(
      expect.objectContaining({
        awardedXp: 420,
        source: "tournament_champion",
        sourceId: "run-1",
      }),
    );
  });

  it("parses tournament context from match params", () => {
    expect(
      resolveTournamentMatchContextFromParams({
        tournamentRunId: "run-1",
        tournamentId: "tour-1",
        tournamentRound: 3,
        tournamentEntryId: "quarter-final-2",
        tournamentEliminationRisk: true,
      }),
    ).toEqual({
      runId: "run-1",
      tournamentId: "tour-1",
      round: 3,
      entryId: "quarter-final-2",
      eliminationRisk: true,
    });
  });
});

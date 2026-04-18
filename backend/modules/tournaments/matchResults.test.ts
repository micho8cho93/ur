import {
  createSingleEliminationBracket,
  getTournamentBracketEntry,
  getTournamentBracketParticipant,
  type TournamentRunRegistration,
} from "./bracket";
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
const TOURNAMENT_VARIANTS = [
  { modeId: "gameMode_1_piece", pieceCountPerSide: 3, label: "Pure Luck" },
  { modeId: "gameMode_3_pieces", pieceCountPerSide: 3, label: "Race" },
  { modeId: "gameMode_finkel_rules", pieceCountPerSide: 7, label: "Finkel Rules" },
  { modeId: "gameMode_capture", pieceCountPerSide: 5, label: "Capture" },
  { modeId: "gameMode_full_path", pieceCountPerSide: 7, label: "Extended Path" },
  { modeId: "standard", pieceCountPerSide: 7, label: "Quick Play" },
] as const;

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
    matchCreate: jest.fn(() => "match-next-round"),
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

const buildRegistrations = (count: number): TournamentRunRegistration[] =>
  Array.from({ length: count }, (_, index) => ({
    userId: `user-${index + 1}`,
    displayName: `Player ${index + 1}`,
    joinedAt: `2026-03-26T10:0${index}:00.000Z`,
    seed: index + 1,
  }));

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

  it("does not re-join players who are already registered in the public run before writing scores", () => {
    const nk = createNakama();
    const logger = createLogger();
    nk.tournamentJoin.mockImplementation(() => {
      throw new Error("player already joined tournament");
    });
    seedRun(nk, {
      maxSize: 2,
      registrations: [
        {
          userId: "user-light",
          displayName: "Light Player",
          joinedAt: "2026-03-26T10:00:00.000Z",
          seed: 1,
        },
        {
          userId: "user-dark",
          displayName: "Dark Player",
          joinedAt: "2026-03-26T10:01:00.000Z",
          seed: 2,
        },
      ],
    });

    const result = processCompletedAuthoritativeTournamentMatch(nk, logger, createCompletion());

    expect(result.retryableFailure).toBe(false);
    expect(result.record?.counted).toBe(true);
    expect(nk.tournamentJoin).not.toHaveBeenCalled();
    expect(nk.tournamentRecordWrite).toHaveBeenCalledTimes(2);
    expect(result.record?.tournamentRecordWrites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: "user-light",
          score: 1,
        }),
        expect.objectContaining({
          userId: "user-dark",
          score: 0,
        }),
      ]),
    );
  });

  it("advances intermediate-round winners without redundant joins so larger brackets can continue", () => {
    const nk = createNakama();
    const logger = createLogger();
    const startedAt = "2026-03-26T10:30:00.000Z";
    const registrations = buildRegistrations(4);
    nk.tournamentJoin.mockImplementation(() => {
      throw new Error("player already joined tournament");
    });
    seedRun(nk, {
      maxSize: 4,
      registrations,
      bracket: createSingleEliminationBracket(registrations, startedAt),
    });

    const result = processCompletedAuthoritativeTournamentMatch(nk, logger, createCompletion({
      context: {
        runId: "run-1",
        tournamentId: "tour-1",
        round: 1,
        entryId: "round-1-match-1",
        eliminationRisk: true,
      },
      winnerUserId: "user-1",
      loserUserId: "user-2",
      players: [
        {
          userId: "user-1",
          username: "player-1",
          color: "light",
          didWin: true,
          score: 1,
          finishedCount: 7,
          capturesMade: 2,
          capturesSuffered: 0,
          playerMoveCount: 9,
        },
        {
          userId: "user-2",
          username: "player-2",
          color: "dark",
          didWin: false,
          score: 0,
          finishedCount: 4,
          capturesMade: 0,
          capturesSuffered: 2,
          playerMoveCount: 9,
        },
      ],
    }));

    expect(result.retryableFailure).toBe(false);
    expect(result.record?.counted).toBe(true);
    expect(result.finalizationResult).toBeNull();
    expect(nk.tournamentJoin).not.toHaveBeenCalled();
    expect(nk.tournamentRecordWrite).toHaveBeenCalledTimes(2);
    expect(getTournamentBracketParticipant(result.updatedRun?.bracket ?? null, "user-1")).toEqual(
      expect.objectContaining({
        state: "waiting_next_round",
        currentRound: 2,
        currentEntryId: "round-2-match-1",
        activeMatchId: null,
        finalPlacement: null,
      }),
    );
    expect(getTournamentBracketParticipant(result.updatedRun?.bracket ?? null, "user-2")).toEqual(
      expect.objectContaining({
        state: "eliminated",
        currentRound: 1,
        currentEntryId: "round-1-match-1",
        activeMatchId: null,
        finalPlacement: 3,
      }),
    );
    expect(getTournamentBracketEntry(result.updatedRun?.bracket ?? null, "round-2-match-1")).toEqual(
      expect.objectContaining({
        playerAUserId: "user-1",
        playerBUserId: null,
        status: "pending",
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

  it("does not persist retryable tournament score-sync failures", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedRun(nk);
    nk.tournamentJoin.mockImplementation(() => {
      throw new Error("temporary join outage");
    });

    const result = processCompletedAuthoritativeTournamentMatch(nk, logger, createCompletion());

    expect(result.retryableFailure).toBe(true);
    expect(result.record).toBeNull();
    expect(result.finalizationResult).toBeNull();
    expect(nk.tournamentRecordWrite).not.toHaveBeenCalled();
    expect(
      nk.storage.get(buildStorageKey(TOURNAMENT_MATCH_RESULTS_COLLECTION, "run-1:match-1")),
    ).toBeUndefined();

    const storedRun = nk.storage.get(buildStorageKey(TOURNAMENT_RUNS_COLLECTION, "run-1"));
    expect(storedRun?.value).toEqual(
      expect.objectContaining({
        metadata: {},
      }),
    );
  });

  it.each(TOURNAMENT_VARIANTS)(
    "finalizes a bracketed final from authoritative results for $label tournaments even when tournament score writes fail",
    ({ modeId, pieceCountPerSide }) => {
    const nk = createNakama();
    const logger = createLogger();
    const startedAt = "2026-03-26T10:30:00.000Z";
    const registrations = buildRegistrations(2);
    seedRun(nk, {
      metadata: {
        gameMode: modeId,
        xpForTournamentChampion: 420,
      },
      maxSize: 2,
      registrations,
      bracket: createSingleEliminationBracket(registrations, startedAt),
    });
    nk.tournamentRecordWrite.mockImplementation(() => {
      throw new Error("tournament score write failed");
    });
    nk.tournamentRecordsList.mockReturnValue({
      records: [
        {
          rank: 1,
          owner_id: "user-2",
          username: "Player 2",
          score: 0,
        },
        {
          rank: 2,
          owner_id: "user-1",
          username: "Player 1",
          score: 0,
        },
      ],
      owner_records: [],
      rank_count: 2,
    });

    const result = processCompletedAuthoritativeTournamentMatch(nk, logger, createCompletion({
      modeId,
      players: [
        {
          userId: "user-1",
          username: "Player 1",
          color: "light",
          didWin: true,
          score: 1,
          finishedCount: pieceCountPerSide,
          capturesMade: 0,
          capturesSuffered: 0,
          playerMoveCount: 4,
        },
        {
          userId: "user-2",
          username: "Player 2",
          color: "dark",
          didWin: false,
          score: 0,
          finishedCount: 0,
          capturesMade: 0,
          capturesSuffered: 0,
          playerMoveCount: 4,
        },
      ],
      winnerUserId: "user-1",
      loserUserId: "user-2",
    }));

    expect(result.retryableFailure).toBe(false);
    expect(result.record?.valid).toBe(true);
    expect(result.record?.counted).toBe(false);
    expect(result.record?.errorMessage).toBe("tournament score write failed");
    expect(result.finalizationResult?.run.lifecycle).toBe("finalized");
    expect(result.updatedRun?.bracket?.finalizedAt).toBe("2026-03-26T11:00:00.000Z");
    expect(result.finalizationResult?.finalSnapshot.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rank: 1,
          owner_id: "user-1",
        }),
        expect.objectContaining({
          rank: 2,
          owner_id: "user-2",
        }),
      ]),
    );

    const storedRun = nk.storage.get(buildStorageKey(TOURNAMENT_RUNS_COLLECTION, "run-1"));
    expect(storedRun?.value).toEqual(
      expect.objectContaining({
        lifecycle: "finalized",
        metadata: expect.objectContaining({
          countedMatchCount: 0,
          lastProcessedWasCounted: false,
          lastProcessedReason: "tournament score write failed",
        }),
        finalSnapshot: expect.objectContaining({
          records: expect.arrayContaining([
            expect.objectContaining({
              rank: 1,
              owner_id: "user-1",
            }),
            expect.objectContaining({
              rank: 2,
              owner_id: "user-2",
            }),
          ]),
        }),
      }),
    );
    },
  );

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
    const startedAt = "2026-03-26T10:30:00.000Z";
    const registrations = [
      {
        userId: "user-light",
        displayName: "light-user",
        joinedAt: "2026-03-26T10:00:00.000Z",
        seed: 1,
      },
      {
        userId: "user-dark",
        displayName: "dark-user",
        joinedAt: "2026-03-26T10:01:00.000Z",
        seed: 2,
      },
    ];
    seedRun(nk, {
      metadata: {
        xpForTournamentChampion: 420,
      },
      maxSize: 2,
      registrations,
      bracket: createSingleEliminationBracket(registrations, startedAt),
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
          score: 0,
          subscore: 0,
          num_score: 0,
        },
        {
          rank: 2,
          owner_id: "user-dark",
          username: "dark-user",
          score: 0,
          subscore: 0,
          num_score: 0,
        },
      ],
      owner_records: [],
      rank_count: 2,
    });

    const result = processCompletedAuthoritativeTournamentMatch(nk, logger, createCompletion());

    expect(result.record?.counted).toBe(true);
    expect(nk.tournamentRanksDisable).toHaveBeenCalledWith("tour-1");
    expect(result.finalizationResult?.finalSnapshot.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rank: 1,
          owner_id: "user-light",
          score: 1,
          subscore: 7,
          num_score: 1,
        }),
        expect.objectContaining({
          rank: 2,
          owner_id: "user-dark",
          score: 0,
          subscore: 4,
          num_score: 1,
        }),
      ]),
    );

    const storedRun = nk.storage.get(buildStorageKey(TOURNAMENT_RUNS_COLLECTION, "run-1"));
    expect(storedRun?.value).toEqual(
      expect.objectContaining({
        lifecycle: "finalized",
        finalSnapshot: expect.objectContaining({
          records: expect.arrayContaining([
            expect.objectContaining({
              rank: 1,
              owner_id: "user-light",
              score: 1,
              subscore: 7,
              num_score: 1,
            }),
            expect.objectContaining({
              rank: 2,
              owner_id: "user-dark",
              score: 0,
              subscore: 4,
              num_score: 1,
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

  it("recovers a counted duplicate result by advancing the bracket and finalizing the run", () => {
    const nk = createNakama();
    const logger = createLogger();
    const startedAt = "2026-03-26T10:30:00.000Z";
    const registrations = buildRegistrations(2);
    seedRun(nk, {
      metadata: {
        xpForTournamentChampion: 420,
      },
      maxSize: 2,
      registrations,
      bracket: createSingleEliminationBracket(registrations, startedAt),
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
          owner_id: "user-1",
          username: "Player 1",
          score: 1,
        },
        {
          rank: 2,
          owner_id: "user-2",
          username: "Player 2",
          score: 0,
        },
      ],
      owner_records: [],
      rank_count: 2,
    });

    const completion = createCompletion({
      players: [
        {
          userId: "user-1",
          username: "Player 1",
          color: "light",
          didWin: true,
          score: 1,
          finishedCount: 7,
          capturesMade: 2,
          capturesSuffered: 0,
          playerMoveCount: 9,
        },
        {
          userId: "user-2",
          username: "Player 2",
          color: "dark",
          didWin: false,
          score: 0,
          finishedCount: 4,
          capturesMade: 0,
          capturesSuffered: 2,
          playerMoveCount: 9,
        },
      ],
      winnerUserId: "user-1",
      loserUserId: "user-2",
    });

    nk.storage.set(buildStorageKey(TOURNAMENT_MATCH_RESULTS_COLLECTION, "run-1:match-1"), {
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION,
      key: "run-1:match-1",
      value: {
        resultId: "run-1:match-1",
        matchId: "match-1",
        runId: "run-1",
        tournamentId: "tour-1",
        createdAt: completion.completedAt,
        updatedAt: completion.completedAt,
        valid: true,
        counted: true,
        invalidReason: null,
        summary: {
          modeId: completion.modeId,
          totalMoves: completion.totalMoves,
          revision: completion.revision,
          completedAt: completion.completedAt,
          round: completion.context?.round ?? null,
          entryId: completion.context?.entryId ?? null,
          winningColor: completion.winningColor,
          winnerUserId: completion.winnerUserId,
          loserUserId: completion.loserUserId,
          classification: completion.classification,
          players: completion.players,
        },
        tournamentRecordWrites: [],
        errorMessage: null,
      },
      version: "result-version-1",
    });

    const result = processCompletedAuthoritativeTournamentMatch(nk, logger, completion);

    expect(result.duplicate).toBe(true);
    expect(result.retryableFailure).toBe(false);
    expect(result.finalizationResult?.run.lifecycle).toBe("finalized");
    expect(result.updatedRun?.bracket?.finalizedAt).toBe(completion.completedAt);
    expect(nk.tournamentRecordWrite).not.toHaveBeenCalled();

    const storedRun = nk.storage.get(buildStorageKey(TOURNAMENT_RUNS_COLLECTION, "run-1"));
    expect(storedRun?.value).toEqual(
      expect.objectContaining({
        lifecycle: "finalized",
        metadata: expect.objectContaining({
          countedMatchCount: 1,
          countedResultIds: ["run-1:match-1"],
        }),
        bracket: expect.objectContaining({
          finalizedAt: completion.completedAt,
          winnerUserId: "user-1",
          runnerUpUserId: "user-2",
        }),
      }),
    );
  });

  it("finalizes the deciding match with a bracket fallback snapshot when standings lookup fails", () => {
    const nk = createNakama();
    const logger = createLogger();
    const startedAt = "2026-03-26T10:30:00.000Z";
    seedRun(nk, {
      metadata: {
        xpForTournamentChampion: 420,
      },
      maxSize: 2,
      registrations: buildRegistrations(2),
      bracket: createSingleEliminationBracket(buildRegistrations(2), startedAt),
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
    nk.tournamentRecordsList.mockImplementation(() => {
      throw new Error("standings unavailable");
    });

    const result = processCompletedAuthoritativeTournamentMatch(nk, logger, createCompletion({
      players: [
        {
          userId: "user-1",
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
          userId: "user-2",
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
      winnerUserId: "user-1",
      loserUserId: "user-2",
    }));

    expect(result.record?.counted).toBe(true);
    expect(result.finalizationResult?.run.lifecycle).toBe("finalized");
    expect(result.finalizationResult?.championUserId).toBe("user-1");
    expect(result.finalizationResult?.finalSnapshot.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rank: 1,
          owner_id: "user-1",
        }),
        expect.objectContaining({
          rank: 2,
          owner_id: "user-2",
        }),
      ]),
    );

    const storedRun = nk.storage.get(buildStorageKey(TOURNAMENT_RUNS_COLLECTION, "run-1"));
    expect(storedRun?.value).toEqual(
      expect.objectContaining({
        lifecycle: "finalized",
        finalSnapshot: expect.objectContaining({
          records: expect.arrayContaining([
            expect.objectContaining({
              rank: 1,
              owner_id: "user-1",
            }),
          ]),
        }),
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

import {
  AUTO_TOURNAMENT_DURATION_SECONDS,
  rpcAdminDeleteTournament,
  rpcAdminCreateTournamentRun,
  rpcAdminFinalizeTournament,
  rpcAdminGetTournamentStandings,
  rpcAdminGetTournamentRun,
  rpcAdminListTournaments,
  rpcAdminOpenTournament,
  RUNS_COLLECTION,
  RUNS_INDEX_KEY,
} from "./admin";
import { rpcAdminExportTournament } from "./export";
import { ADMIN_COLLECTION, ADMIN_ROLE_KEY } from "./auth";
import { completeTournamentBracketMatch, createSingleEliminationBracket } from "./bracket";
import {
  GLOBAL_STORAGE_USER_ID,
  PROGRESSION_COLLECTION,
  PROGRESSION_PROFILE_KEY,
  XP_REWARD_LEDGER_COLLECTION,
} from "../progression";

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

type StorageDeleteRequest = {
  collection: string;
  key: string;
  userId?: string;
};

const buildStorageKey = (collection: string, key: string, userId = ""): string =>
  `${collection}:${key}:${userId}`;

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const createNakama = () => {
  const storage = new Map<string, StoredObject>();
  let versionCounter = 1;

  const storageRead = jest.fn((requests: StorageReadRequest[]) =>
    requests
      .map((request) => {
        const direct =
          storage.get(buildStorageKey(request.collection, request.key, request.userId ?? ""));
        if (direct) {
          return direct;
        }

        if (!request.userId) {
          return storage.get(buildStorageKey(request.collection, request.key, GLOBAL_STORAGE_USER_ID));
        }

        return undefined;
      })
      .filter((entry): entry is StoredObject => Boolean(entry)),
  );

  const storageWrite = jest.fn((writes: StorageWriteRequest[]) => {
    writes.forEach((write) => {
      if ("version" in write && write.version === "") {
        throw new TypeError("expects 'version' value to be a non-empty string");
      }

      const storageKey = buildStorageKey(write.collection, write.key, write.userId ?? "");
      const existing = storage.get(storageKey);

      if (typeof write.version === "string" && write.version.length > 0 && write.version !== "*") {
        if (!existing || existing.version !== write.version) {
          throw new Error(`Storage version mismatch for ${storageKey}`);
        }
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

  const storageDelete = jest.fn((deletes: StorageDeleteRequest[]) => {
    deletes.forEach((entry) => {
      storage.delete(buildStorageKey(entry.collection, entry.key, entry.userId ?? ""));
    });
  });

  return {
    storage,
    storageRead,
    storageWrite,
    storageDelete,
    tournamentsGetId: jest.fn((_ids: string[]) => [] as Array<{ id: string }>),
    tournamentCreate: jest.fn(),
    tournamentDelete: jest.fn(),
    tournamentRanksDisable: jest.fn(),
    tournamentRecordsList: jest.fn(() => ({
      records: [] as Array<Record<string, unknown>>,
      owner_records: [] as Array<Record<string, unknown>>,
      rank_count: 0,
    })),
  };
};

const seedAdminRole = (nk: ReturnType<typeof createNakama>, userId: string, role = "operator") => {
  nk.storage.set(buildStorageKey(ADMIN_COLLECTION, ADMIN_ROLE_KEY, userId), {
    collection: ADMIN_COLLECTION,
    key: ADMIN_ROLE_KEY,
    userId,
    value: { role },
    version: "admin-role-v1",
  });
};

describe("admin tournament run creation", () => {
  it("creates a run without sending empty-string storage versions", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1");

    const response = JSON.parse(
      rpcAdminCreateTournamentRun(
        {
          userId: "admin-1",
          username: "Operator",
        },
        logger,
        nk,
        JSON.stringify({
          runId: "spring-crown-2026",
          title: "Spring Crown 2026",
          description: "Season opener",
          metadata: {
            gameMode: "Classic ladder",
            region: "Global",
            buyIn: "Free",
          },
          startTime: 1_774_572_800,
          maxSize: 32,
          joinRequired: true,
          enableRanks: true,
        }),
      ),
    ) as {
      run: {
        runId: string;
        title: string;
      };
    };

    expect(response.run).toEqual(
      expect.objectContaining({
        runId: "spring-crown-2026",
        title: "Spring Crown 2026",
      }),
    );

    const writes = nk.storageWrite.mock.calls.flatMap(([batch]) => batch as StorageWriteRequest[]);
    const runWrite = writes.find((write) => write.collection === RUNS_COLLECTION && write.key === "spring-crown-2026");
    const indexWrite = writes.find((write) => write.collection === RUNS_COLLECTION && write.key === RUNS_INDEX_KEY);

    expect(runWrite).toBeDefined();
    expect(runWrite).not.toHaveProperty("version");
    expect(indexWrite).toBeDefined();
    expect(indexWrite).not.toHaveProperty("version");

    expect(nk.storage.get(buildStorageKey(RUNS_COLLECTION, "spring-crown-2026"))?.value).toEqual(
      expect.objectContaining({
        runId: "spring-crown-2026",
        tournamentId: "spring-crown-2026",
        title: "Spring Crown 2026",
        duration: AUTO_TOURNAMENT_DURATION_SECONDS,
        endTime: 1_774_572_800 + AUTO_TOURNAMENT_DURATION_SECONDS,
        maxSize: 32,
        maxNumScore: 5,
      }),
    );

    expect(nk.storage.get(buildStorageKey(RUNS_COLLECTION, RUNS_INDEX_KEY))?.value).toEqual(
      expect.objectContaining({
        runIds: ["spring-crown-2026"],
      }),
    );
  });

  it("returns a null run instead of throwing when the requested run does not exist", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1", "viewer");

    const response = JSON.parse(
      rpcAdminGetTournamentRun(
        {
          userId: "admin-1",
          username: "Viewer",
        },
        logger,
        nk,
        JSON.stringify({
          runId: "test-tournament",
        }),
      ),
    ) as {
      ok: boolean;
      run: null;
      nakamaTournament: null;
    };

    expect(response).toEqual({
      ok: true,
      run: null,
      nakamaTournament: null,
    });
  });

  it("lists and reads global run records when Nakama returns the nil UUID as userId", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1", "viewer");

    nk.storage.set(buildStorageKey(RUNS_COLLECTION, RUNS_INDEX_KEY, GLOBAL_STORAGE_USER_ID), {
      collection: RUNS_COLLECTION,
      key: RUNS_INDEX_KEY,
      userId: GLOBAL_STORAGE_USER_ID,
      value: {
        runIds: ["test-tournament"],
        updatedAt: "2026-03-27T10:00:00.000Z",
      },
      version: "index-v1",
    });

    nk.storage.set(buildStorageKey(RUNS_COLLECTION, "test-tournament", GLOBAL_STORAGE_USER_ID), {
      collection: RUNS_COLLECTION,
      key: "test-tournament",
      userId: GLOBAL_STORAGE_USER_ID,
      value: {
        runId: "test-tournament",
        tournamentId: "test-tournament",
        title: "Test Tournament",
        description: "Saved globally",
        category: 0,
        authoritative: true,
        sortOrder: "desc",
        operator: "incr",
        resetSchedule: "",
        metadata: {
          gameMode: "Classic ladder",
          region: "Global",
          buyIn: "Free",
        },
        startTime: 1_774_572_800,
        endTime: 1_774_580_000,
        duration: 7_200,
        maxSize: 32,
        maxNumScore: 7,
        joinRequired: true,
        enableRanks: true,
        lifecycle: "draft",
        createdAt: "2026-03-27T10:00:00.000Z",
        updatedAt: "2026-03-27T10:00:00.000Z",
        createdByUserId: "admin-1",
        createdByLabel: "Viewer",
        openedAt: null,
        closedAt: null,
        finalizedAt: null,
        finalSnapshot: null,
      },
      version: "run-v1",
    });

    const listResponse = JSON.parse(
      rpcAdminListTournaments(
        {
          userId: "admin-1",
          username: "Viewer",
        },
        logger,
        nk,
        JSON.stringify({ limit: 10 }),
      ),
    ) as {
      ok: boolean;
      runs: { runId: string }[];
    };

    const getResponse = JSON.parse(
      rpcAdminGetTournamentRun(
        {
          userId: "admin-1",
          username: "Viewer",
        },
        logger,
        nk,
        JSON.stringify({ runId: "test-tournament" }),
      ),
    ) as {
      ok: boolean;
      run: { runId: string } | null;
    };

    expect(listResponse.runs).toEqual([
      expect.objectContaining({
        runId: "test-tournament",
      }),
    ]);
    expect(getResponse.run).toEqual(
      expect.objectContaining({
        runId: "test-tournament",
      }),
    );
  });

  it("auto-finalizes completed bracket runs while serving admin list and detail responses", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1", "viewer");

    const startedAt = "2026-03-27T10:00:00.000Z";
    const registrations = [
      {
        userId: "champion-user",
        displayName: "Champion",
        joinedAt: startedAt,
        seed: 1,
      },
      {
        userId: "runner-up-user",
        displayName: "Runner Up",
        joinedAt: startedAt,
        seed: 2,
      },
    ];
    const finalizedBracket = completeTournamentBracketMatch(
      createSingleEliminationBracket(registrations, startedAt),
      {
        entryId: "round-1-match-1",
        matchId: "match-final",
        winnerUserId: "champion-user",
        loserUserId: "runner-up-user",
        completedAt: "2026-03-27T10:05:00.000Z",
      },
    );

    nk.storage.set(buildStorageKey(RUNS_COLLECTION, RUNS_INDEX_KEY), {
      collection: RUNS_COLLECTION,
      key: RUNS_INDEX_KEY,
      value: {
        runIds: ["test-tournament"],
        updatedAt: startedAt,
      },
      version: "index-v1",
    });
    nk.storage.set(buildStorageKey(RUNS_COLLECTION, "test-tournament"), {
      collection: RUNS_COLLECTION,
      key: "test-tournament",
      value: {
        runId: "test-tournament",
        tournamentId: "test-tournament",
        title: "Test Tournament",
        description: "Completed bracket",
        category: 0,
        authoritative: true,
        sortOrder: "desc",
        operator: "incr",
        resetSchedule: "",
        metadata: {
          xpForTournamentChampion: 0,
        },
        startTime: 1_774_572_800,
        endTime: 1_774_580_000,
        duration: 7_200,
        maxSize: 2,
        maxNumScore: 1,
        joinRequired: true,
        enableRanks: true,
        lifecycle: "open",
        registrations,
        bracket: finalizedBracket,
        createdAt: startedAt,
        updatedAt: "2026-03-27T10:05:00.000Z",
        createdByUserId: "admin-1",
        createdByLabel: "Viewer",
        openedAt: startedAt,
        closedAt: null,
        finalizedAt: null,
        finalSnapshot: null,
      },
      version: "run-v1",
    });
    nk.tournamentRecordsList.mockReturnValue({
      records: [
        {
          rank: 1,
          owner_id: "champion-user",
          username: "Champion",
          score: 1,
        },
        {
          rank: 2,
          owner_id: "runner-up-user",
          username: "Runner Up",
          score: 0,
        },
      ],
      owner_records: [],
      rank_count: 2,
    });

    const listResponse = JSON.parse(
      rpcAdminListTournaments(
        {
          userId: "admin-1",
          username: "Viewer",
        },
        logger,
        nk,
        JSON.stringify({ limit: 10 }),
      ),
    ) as {
      runs: Array<{ runId: string; lifecycle: string; finalizedAt: string | null }>;
    };
    const getResponse = JSON.parse(
      rpcAdminGetTournamentRun(
        {
          userId: "admin-1",
          username: "Viewer",
        },
        logger,
        nk,
        JSON.stringify({ runId: "test-tournament" }),
      ),
    ) as {
      run: { lifecycle: string; finalizedAt: string | null };
    };

    expect(listResponse.runs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          runId: "test-tournament",
          lifecycle: "finalized",
        }),
      ]),
    );
    expect(getResponse.run.lifecycle).toBe("finalized");
    expect(getResponse.run.finalizedAt).not.toBeNull();
    expect(nk.tournamentRanksDisable).toHaveBeenCalledWith("test-tournament");
  });

  it("opens a draft run and creates the Nakama tournament with the runtime argument order", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1", "operator");

    nk.storage.set(buildStorageKey(RUNS_COLLECTION, "test-tournament"), {
      collection: RUNS_COLLECTION,
      key: "test-tournament",
      value: {
        runId: "test-tournament",
        tournamentId: "test-tournament",
        title: "Test Tournament",
        description: "Saved draft",
        category: 3,
        authoritative: true,
        sortOrder: "desc",
        operator: "incr",
        resetSchedule: "",
        metadata: {
          gameMode: "Classic ladder",
          region: "Global",
          buyIn: "Free",
        },
        startTime: 1_774_572_800,
        endTime: 1_774_580_000,
        duration: 7_200,
        maxSize: 32,
        maxNumScore: 7,
        joinRequired: true,
        enableRanks: true,
        lifecycle: "draft",
        createdAt: "2026-03-27T10:00:00.000Z",
        updatedAt: "2026-03-27T10:00:00.000Z",
        createdByUserId: "admin-1",
        createdByLabel: "Operator",
        openedAt: null,
        closedAt: null,
        finalizedAt: null,
        finalSnapshot: null,
      },
      version: "run-v1",
    });

    const response = JSON.parse(
      rpcAdminOpenTournament(
        {
          userId: "admin-1",
          username: "Operator",
        },
        logger,
        nk,
        JSON.stringify({ runId: "test-tournament" }),
      ),
    ) as {
      run: {
        runId: string;
        lifecycle: string;
      };
    };

    expect(response.run).toEqual(
      expect.objectContaining({
        runId: "test-tournament",
        lifecycle: "open",
      }),
    );

    expect(nk.tournamentCreate).toHaveBeenCalledWith(
      "test-tournament",
      true,
      "desc",
      "incr",
      7_200,
      "",
      {
        gameMode: "Classic ladder",
        region: "Global",
        buyIn: "Free",
      },
      "Test Tournament",
      "Saved draft",
      3,
      1_774_572_800,
      1_774_580_000,
      32,
      7,
      true,
      true,
    );
  });

  it("deletes a run, removes it from the index, and deletes the backing Nakama tournament", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1", "admin");

    nk.storage.set(buildStorageKey(RUNS_COLLECTION, RUNS_INDEX_KEY), {
      collection: RUNS_COLLECTION,
      key: RUNS_INDEX_KEY,
      value: {
        runIds: ["test-tournament"],
        updatedAt: "2026-03-27T10:00:00.000Z",
      },
      version: "index-v1",
    });

    nk.storage.set(buildStorageKey(RUNS_COLLECTION, "test-tournament"), {
      collection: RUNS_COLLECTION,
      key: "test-tournament",
      value: {
        runId: "test-tournament",
        tournamentId: "test-tournament",
        title: "Test Tournament",
        description: "Saved open run",
        category: 0,
        authoritative: true,
        sortOrder: "desc",
        operator: "incr",
        resetSchedule: "",
        metadata: {
          gameMode: "Classic ladder",
          region: "Global",
          buyIn: "Free",
        },
        startTime: 1_774_572_800,
        endTime: 1_774_580_000,
        duration: 7_200,
        maxSize: 32,
        maxNumScore: 7,
        joinRequired: true,
        enableRanks: true,
        lifecycle: "open",
        createdAt: "2026-03-27T10:00:00.000Z",
        updatedAt: "2026-03-27T10:00:00.000Z",
        createdByUserId: "admin-1",
        createdByLabel: "Admin",
        openedAt: "2026-03-27T10:05:00.000Z",
        closedAt: null,
        finalizedAt: null,
        finalSnapshot: null,
        registrations: [
          {
            userId: "player-1",
            displayName: "RoyalPlayer",
            joinedAt: "2026-03-27T10:06:00.000Z",
            seed: 1,
          },
        ],
      },
      version: "run-v1",
    });

    nk.storage.set(buildStorageKey("tournament_run_memberships", "test-tournament", "player-1"), {
      collection: "tournament_run_memberships",
      key: "test-tournament",
      userId: "player-1",
      value: {
        runId: "test-tournament",
        tournamentId: "test-tournament",
        userId: "player-1",
        displayName: "RoyalPlayer",
        joinedAt: "2026-03-27T10:06:00.000Z",
        updatedAt: "2026-03-27T10:06:00.000Z",
      },
      version: "membership-v1",
    });

    nk.storage.set(buildStorageKey("tournament_match_queue", "test-tournament", SYSTEM_USER_ID), {
      collection: "tournament_match_queue",
      key: "test-tournament",
      userId: SYSTEM_USER_ID,
      value: {
        runId: "test-tournament",
        tournamentId: "test-tournament",
        matchId: "match-1",
      },
      version: "queue-v1",
    });

    nk.tournamentsGetId.mockImplementation((ids: string[]) =>
      ids.includes("test-tournament") ? [{ id: "test-tournament" }] : [],
    );

    const response = JSON.parse(
      rpcAdminDeleteTournament(
        {
          userId: "admin-1",
          username: "Admin",
        },
        logger,
        nk,
        JSON.stringify({
          runId: "test-tournament",
        }),
      ),
    ) as {
      deleted: boolean;
      deletedNakamaTournament: boolean;
      run: { runId: string };
    };

    expect(response).toEqual(
      expect.objectContaining({
        deleted: true,
        deletedNakamaTournament: true,
        run: expect.objectContaining({
          runId: "test-tournament",
        }),
      }),
    );

    expect(nk.storage.get(buildStorageKey(RUNS_COLLECTION, "test-tournament"))).toBeUndefined();
    expect(
      nk.storage.get(buildStorageKey("tournament_match_queue", "test-tournament", SYSTEM_USER_ID)),
    ).toBeUndefined();
    expect(
      nk.storage.get(buildStorageKey("tournament_run_memberships", "test-tournament", "player-1")),
    ).toBeUndefined();
    expect(nk.storage.get(buildStorageKey(RUNS_COLLECTION, RUNS_INDEX_KEY))?.value).toEqual(
      expect.objectContaining({
        runIds: [],
      }),
    );
    expect(nk.tournamentDelete).toHaveBeenCalledWith("test-tournament");
  });

  it("awards champion XP once when a tournament is finalized", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1", "admin");

    nk.storage.set(buildStorageKey(RUNS_COLLECTION, "test-tournament"), {
      collection: RUNS_COLLECTION,
      key: "test-tournament",
      value: {
        runId: "test-tournament",
        tournamentId: "test-tournament",
        title: "Test Tournament",
        description: "Saved closed run",
        category: 0,
        authoritative: true,
        sortOrder: "desc",
        operator: "incr",
        resetSchedule: "",
        metadata: {
          gameMode: "Classic ladder",
          region: "Global",
          buyIn: "Free",
          xpForTournamentChampion: 400,
        },
        startTime: 1_774_572_800,
        endTime: 1_774_580_000,
        duration: 7_200,
        maxSize: 32,
        maxNumScore: 7,
        joinRequired: true,
        enableRanks: true,
        lifecycle: "closed",
        createdAt: "2026-03-27T10:00:00.000Z",
        updatedAt: "2026-03-27T10:00:00.000Z",
        createdByUserId: "admin-1",
        createdByLabel: "Admin",
        openedAt: "2026-03-27T10:05:00.000Z",
        closedAt: "2026-03-27T12:00:00.000Z",
        finalizedAt: null,
        finalSnapshot: null,
      },
      version: "run-v1",
    });

    nk.tournamentRecordsList.mockReturnValue({
      records: [
        {
          rank: 1,
          owner_id: "champion-user",
          username: "Champion",
          score: 3,
        },
        {
          rank: 2,
          owner_id: "runner-up-user",
          username: "Finalist",
          score: 2,
        },
      ],
      owner_records: [],
      rank_count: 2,
    });

    const firstResponse = JSON.parse(
      rpcAdminFinalizeTournament(
        {
          userId: "admin-1",
          username: "Admin",
        },
        logger,
        nk,
        JSON.stringify({
          runId: "test-tournament",
          overrideExpiry: 0,
        }),
      ),
    ) as {
      ok: boolean;
      run: { lifecycle: string; finalizedAt: string | null };
      finalSnapshot: { records: { owner_id: string; rank: number }[] };
    };

    expect(firstResponse.ok).toBe(true);
    expect(firstResponse.run.lifecycle).toBe("finalized");
    expect(firstResponse.run.finalizedAt).not.toBeNull();
    expect(firstResponse.finalSnapshot.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rank: 1,
          owner_id: "champion-user",
        }),
      ]),
    );

    const championProfile = nk.storage.get(
      buildStorageKey(PROGRESSION_COLLECTION, PROGRESSION_PROFILE_KEY, "champion-user"),
    )?.value as { totalXp: number; currentRankTitle: string } | undefined;
    const championLedger = nk.storage.get(
      buildStorageKey(XP_REWARD_LEDGER_COLLECTION, "tournament_champion:test-tournament", "champion-user"),
    )?.value as { awardedXp: number; source: string; sourceId: string } | undefined;

    expect(championProfile).toEqual(
      expect.objectContaining({
        totalXp: 400,
      }),
    );
    expect(championLedger).toEqual(
      expect.objectContaining({
        awardedXp: 400,
        source: "tournament_champion",
        sourceId: "test-tournament",
      }),
    );
    expect(nk.tournamentRanksDisable).toHaveBeenCalledWith("test-tournament");

    rpcAdminFinalizeTournament(
      {
        userId: "admin-1",
        username: "Admin",
      },
      logger,
      nk,
      JSON.stringify({
        runId: "test-tournament",
        overrideExpiry: 0,
      }),
    );

    const championProfileAfterRetry = nk.storage.get(
      buildStorageKey(PROGRESSION_COLLECTION, PROGRESSION_PROFILE_KEY, "champion-user"),
    )?.value as { totalXp: number } | undefined;
    const championLedgerEntries = Array.from(nk.storage.keys()).filter((key) =>
      key === buildStorageKey(
        XP_REWARD_LEDGER_COLLECTION,
        "tournament_champion:test-tournament",
        "champion-user",
      ),
    );

    expect(championProfileAfterRetry?.totalXp).toBe(400);
    expect(championLedgerEntries).toHaveLength(1);
  });

  it("serves the stored final snapshot to internals once a tournament is finalized", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1", "viewer");

    nk.storage.set(buildStorageKey(RUNS_COLLECTION, "finalized-tournament"), {
      collection: RUNS_COLLECTION,
      key: "finalized-tournament",
      value: {
        runId: "finalized-tournament",
        tournamentId: "finalized-tournament",
        title: "Finalized Tournament",
        description: "Saved final snapshot",
        category: 0,
        authoritative: true,
        sortOrder: "desc",
        operator: "incr",
        resetSchedule: "",
        metadata: {
          gameMode: "Classic ladder",
          region: "Global",
          buyIn: "Free",
        },
        startTime: 1_774_572_800,
        endTime: 1_774_580_000,
        duration: 7_200,
        maxSize: 16,
        maxNumScore: 7,
        joinRequired: true,
        enableRanks: true,
        lifecycle: "finalized",
        createdAt: "2026-03-27T10:00:00.000Z",
        updatedAt: "2026-03-27T12:05:00.000Z",
        createdByUserId: "admin-1",
        createdByLabel: "Admin",
        openedAt: "2026-03-27T10:05:00.000Z",
        closedAt: "2026-03-27T12:00:00.000Z",
        finalizedAt: "2026-03-27T12:05:00.000Z",
        finalSnapshot: {
          generatedAt: "2026-03-27T12:05:00.000Z",
          overrideExpiry: 0,
          rankCount: 2,
          records: [
            {
              rank: 1,
              owner_id: "champion-user",
              username: "Champion",
              score: 3,
              metadata: {
                result: "win",
              },
            },
            {
              rank: 2,
              owner_id: "runner-up-user",
              username: "Finalist",
              score: 2,
              metadata: {
                result: "loss",
              },
            },
          ],
          prevCursor: null,
          nextCursor: null,
        },
      },
      version: "run-v1",
    });

    const response = JSON.parse(
      rpcAdminGetTournamentStandings(
        {
          userId: "admin-1",
          username: "Viewer",
        },
        logger,
        nk,
        JSON.stringify({
          runId: "finalized-tournament",
          limit: 10,
        }),
      ),
    ) as {
      standings: {
        records: Array<{ owner_id: string; metadata?: { result?: string } }>;
      };
    };

    expect(response.standings.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          owner_id: "champion-user",
          metadata: expect.objectContaining({
            result: "win",
          }),
        }),
      ]),
    );
    expect(nk.tournamentRecordsList).not.toHaveBeenCalled();
  });

  it("reconstructs finalized standings for internals when the stored final snapshot is stale", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1", "viewer");
    const startedAt = "2026-03-27T10:05:00.000Z";
    const completedAt = "2026-03-27T12:00:00.000Z";
    const registrations = [
      {
        userId: "user-1",
        displayName: "Champion",
        joinedAt: "2026-03-27T10:06:00.000Z",
        seed: 1,
      },
      {
        userId: "user-2",
        displayName: "Finalist",
        joinedAt: "2026-03-27T10:07:00.000Z",
        seed: 2,
      },
    ];
    const finalizedBracket = completeTournamentBracketMatch(
      createSingleEliminationBracket(registrations, startedAt),
      {
        entryId: "round-1-match-1",
        matchId: "match-1",
        winnerUserId: "user-1",
        loserUserId: "user-2",
        completedAt,
      },
    );

    nk.storage.set(buildStorageKey(RUNS_COLLECTION, "finalized-tournament"), {
      collection: RUNS_COLLECTION,
      key: "finalized-tournament",
      value: {
        runId: "finalized-tournament",
        tournamentId: "finalized-tournament",
        title: "Finalized Tournament",
        description: "Saved final snapshot",
        category: 0,
        authoritative: true,
        sortOrder: "desc",
        operator: "incr",
        resetSchedule: "",
        metadata: {
          gameMode: "Classic ladder",
          region: "Global",
          buyIn: "Free",
          countedMatchCount: 1,
          countedResultIds: ["finalized-tournament:match-1"],
        },
        startTime: 1_774_572_800,
        endTime: 1_774_580_000,
        duration: 7_200,
        maxSize: 2,
        maxNumScore: 1,
        joinRequired: true,
        enableRanks: true,
        lifecycle: "finalized",
        createdAt: "2026-03-27T10:00:00.000Z",
        updatedAt: "2026-03-27T12:05:00.000Z",
        createdByUserId: "admin-1",
        createdByLabel: "Admin",
        openedAt: startedAt,
        closedAt: completedAt,
        finalizedAt: "2026-03-27T12:05:00.000Z",
        registrations,
        bracket: finalizedBracket,
        finalSnapshot: {
          generatedAt: "2026-03-27T12:05:00.000Z",
          overrideExpiry: 0,
          rankCount: 2,
          records: [
            {
              rank: 1,
              owner_id: "user-1",
              username: "Champion",
              score: 0,
              subscore: 0,
              num_score: 0,
              metadata: {
                result: "win",
              },
            },
            {
              rank: 2,
              owner_id: "user-2",
              username: "Finalist",
              score: 0,
              subscore: 0,
              num_score: 0,
              metadata: {
                result: "loss",
              },
            },
          ],
          prevCursor: null,
          nextCursor: null,
        },
      },
      version: "run-v1",
    });
    nk.storage.set(buildStorageKey("tournament_match_results", "finalized-tournament:match-1"), {
      collection: "tournament_match_results",
      key: "finalized-tournament:match-1",
      value: {
        resultId: "finalized-tournament:match-1",
        matchId: "match-1",
        runId: "finalized-tournament",
        tournamentId: "finalized-tournament",
        createdAt: completedAt,
        updatedAt: completedAt,
        valid: true,
        counted: true,
        invalidReason: null,
        errorMessage: null,
        summary: {
          completedAt,
          round: 1,
          entryId: "round-1-match-1",
          players: [
            {
              userId: "user-1",
              username: "Champion",
              didWin: true,
              score: 1,
              finishedCount: 7,
            },
            {
              userId: "user-2",
              username: "Finalist",
              didWin: false,
              score: 0,
              finishedCount: 4,
            },
          ],
        },
      },
      version: "result-v1",
    });

    const response = JSON.parse(
      rpcAdminGetTournamentStandings(
        {
          userId: "admin-1",
          username: "Viewer",
        },
        logger,
        nk,
        JSON.stringify({
          runId: "finalized-tournament",
          limit: 10,
        }),
      ),
    ) as {
      standings: {
        records: Array<{
          owner_id: string;
          score: number;
          subscore: number;
          num_score: number;
        }>;
      };
    };

    expect(response.standings.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          owner_id: "user-1",
          score: 1,
          subscore: 7,
          num_score: 1,
        }),
        expect.objectContaining({
          owner_id: "user-2",
          score: 0,
          subscore: 4,
          num_score: 1,
        }),
      ]),
    );
    expect(nk.tournamentRecordsList).not.toHaveBeenCalled();
  });

  it("exports finalized tournament data with standings, audit entries, and stored match results", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1", "viewer");
    const startedAt = "2026-03-27T10:05:00.000Z";
    const completedAt = "2026-03-27T12:00:00.000Z";
    const registrations = [
      {
        userId: "user-1",
        displayName: "Champion",
        joinedAt: "2026-03-27T10:06:00.000Z",
        seed: 1,
      },
      {
        userId: "user-2",
        displayName: "Finalist",
        joinedAt: "2026-03-27T10:07:00.000Z",
        seed: 2,
      },
    ];
    const finalizedBracket = completeTournamentBracketMatch(
      createSingleEliminationBracket(registrations, startedAt),
      {
        entryId: "round-1-match-1",
        matchId: "match-1",
        winnerUserId: "user-1",
        loserUserId: "user-2",
        completedAt,
      },
    );

    nk.storage.set(buildStorageKey(RUNS_COLLECTION, "finalized-export"), {
      collection: RUNS_COLLECTION,
      key: "finalized-export",
      value: {
        runId: "finalized-export",
        tournamentId: "finalized-export",
        title: "Finalized Export",
        description: "Ready for archive download",
        category: 0,
        authoritative: true,
        sortOrder: "desc",
        operator: "incr",
        resetSchedule: "",
        metadata: {
          gameMode: "standard",
          countedResultIds: ["finalized-export:match-1"],
          lastProcessedResultId: "finalized-export:match-1",
        },
        startTime: 1_774_572_800,
        endTime: 1_774_580_000,
        duration: 7_200,
        maxSize: 2,
        maxNumScore: 1,
        joinRequired: true,
        enableRanks: false,
        lifecycle: "finalized",
        createdAt: "2026-03-27T10:00:00.000Z",
        updatedAt: "2026-03-27T12:05:00.000Z",
        createdByUserId: "admin-1",
        createdByLabel: "Admin",
        openedAt: startedAt,
        closedAt: completedAt,
        finalizedAt: "2026-03-27T12:05:00.000Z",
        registrations,
        bracket: finalizedBracket,
        finalSnapshot: {
          generatedAt: "2026-03-27T12:05:00.000Z",
          overrideExpiry: 0,
          rankCount: 2,
          records: [
            {
              rank: 1,
              owner_id: "user-1",
              username: "Champion",
              score: 1,
              subscore: 7,
              num_score: 1,
              metadata: {
                round: 1,
                result: "win",
                matchId: "match-1",
              },
            },
            {
              rank: 2,
              owner_id: "user-2",
              username: "Finalist",
              score: 0,
              subscore: 4,
              num_score: 1,
              metadata: {
                round: 1,
                result: "loss",
                matchId: "match-1",
              },
            },
          ],
          prevCursor: null,
          nextCursor: null,
        },
      },
      version: "run-v1",
    });
    nk.storage.set(buildStorageKey("tournament_match_results", "finalized-export:match-1"), {
      collection: "tournament_match_results",
      key: "finalized-export:match-1",
      value: {
        resultId: "finalized-export:match-1",
        matchId: "match-1",
        runId: "finalized-export",
        tournamentId: "finalized-export",
        createdAt: completedAt,
        updatedAt: completedAt,
        valid: true,
        counted: true,
        invalidReason: null,
        errorMessage: null,
        summary: {
          completedAt,
          round: 1,
          entryId: "round-1-match-1",
          players: [
            {
              userId: "user-1",
              username: "Champion",
              didWin: true,
              score: 1,
              finishedCount: 7,
            },
            {
              userId: "user-2",
              username: "Finalist",
              didWin: false,
              score: 0,
              finishedCount: 4,
            },
          ],
        },
      },
      version: "result-v1",
    });
    nk.storage.set(buildStorageKey("tournament_audit_logs", "recent"), {
      collection: "tournament_audit_logs",
      key: "recent",
      value: {
        entries: [
          {
            id: "audit-1",
            action: "rpc_admin_finalize_tournament",
            userId: "admin-1",
            actorUserId: "admin-1",
            actorLabel: "Admin",
            targetId: "finalized-export",
            tournamentId: "finalized-export",
            tournamentName: "Finalized Export",
            createdAt: "2026-03-27T12:05:00.000Z",
            timestamp: "2026-03-27T12:05:00.000Z",
            metadata: {
              disabledRanks: true,
            },
          },
        ],
        updatedAt: "2026-03-27T12:05:00.000Z",
      },
      version: "audit-v1",
    });

    const response = JSON.parse(
      rpcAdminExportTournament(
        {
          userId: "admin-1",
          username: "Viewer",
        },
        logger,
        nk,
        JSON.stringify({
          runId: "finalized-export",
        }),
      ),
    ) as {
      run: {
        runId: string;
      };
      standings: {
        records: Array<{ owner_id: string }>;
      };
      auditEntries: Array<{ id: string }>;
      matchResults: Array<{ resultId: string }>;
    };

    expect(response.run.runId).toBe("finalized-export");
    expect(response.standings.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          owner_id: "user-1",
        }),
      ]),
    );
    expect(response.auditEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "audit-1",
        }),
      ]),
    );
    expect(response.matchResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resultId: "finalized-export:match-1",
        }),
      ]),
    );
  });

  it("rejects tournament export before the run is finalized", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1", "viewer");

    nk.storage.set(buildStorageKey(RUNS_COLLECTION, "open-export"), {
      collection: RUNS_COLLECTION,
      key: "open-export",
      value: {
        runId: "open-export",
        tournamentId: "open-export",
        title: "Open Export",
        description: "Still live",
        category: 0,
        authoritative: true,
        sortOrder: "desc",
        operator: "incr",
        resetSchedule: "",
        metadata: {
          gameMode: "standard",
        },
        startTime: 1_774_572_800,
        endTime: 1_774_580_000,
        duration: 7_200,
        maxSize: 2,
        maxNumScore: 1,
        joinRequired: true,
        enableRanks: true,
        lifecycle: "open",
        createdAt: "2026-03-27T10:00:00.000Z",
        updatedAt: "2026-03-27T10:05:00.000Z",
        createdByUserId: "admin-1",
        createdByLabel: "Admin",
        openedAt: "2026-03-27T10:05:00.000Z",
        closedAt: null,
        finalizedAt: null,
        registrations: [],
        bracket: null,
        finalSnapshot: null,
      },
      version: "run-v1",
    });

    expect(() =>
      rpcAdminExportTournament(
        {
          userId: "admin-1",
          username: "Viewer",
        },
        logger,
        nk,
        JSON.stringify({
          runId: "open-export",
        }),
      ),
    ).toThrow("Tournament export is only available after the run is finalized.");
  });
});

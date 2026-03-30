import { ADMIN_COLLECTION, ADMIN_ROLE_KEY } from "./auth";
import { completeTournamentBracketMatch, createSingleEliminationBracket } from "./bracket";
import { RUNS_COLLECTION, RUNS_INDEX_KEY } from "./admin";
import { rpcAdminGetTournamentLiveStatus } from "./liveStatus";
import {
  TOURNAMENT_AUDIT_COLLECTION,
  TOURNAMENT_AUDIT_LOG_KEY,
} from "./definitions";

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

const buildStorageKey = (collection: string, key: string, userId = ""): string =>
  `${collection}:${key}:${userId}`;

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const createNakama = () => {
  const storage = new Map<string, StoredObject>();
  const tournaments = new Map<string, Record<string, unknown>>();
  let versionCounter = 1;

  return {
    storage,
    tournaments,
    storageRead: jest.fn((requests: StorageReadRequest[]) =>
      requests
        .map((request) => storage.get(buildStorageKey(request.collection, request.key, request.userId ?? "")))
        .filter((entry): entry is StoredObject => Boolean(entry)),
    ),
    storageWrite: jest.fn((writes: StorageWriteRequest[]) => {
      writes.forEach((write) => {
        const storageKey = buildStorageKey(write.collection, write.key, write.userId ?? "");
        const existing = storage.get(storageKey);

        if (write.version === "*") {
          if (existing) {
            throw new Error(`Storage object already exists for ${storageKey}`);
          }
        } else if (typeof write.version === "string" && write.version.length > 0) {
          if (!existing || existing.version !== write.version) {
            throw new Error(`Storage version mismatch for ${storageKey}`);
          }
        }
      });

      writes.forEach((write) => {
        storage.set(buildStorageKey(write.collection, write.key, write.userId ?? ""), {
          collection: write.collection,
          key: write.key,
          userId: write.userId,
          value: write.value,
          version: `v${versionCounter++}`,
        });
      });
    }),
    tournamentsGetId: jest.fn((ids: string[]) =>
      ids
        .map((id) => tournaments.get(id))
        .filter((entry): entry is Record<string, unknown> => Boolean(entry)),
    ),
  };
};

const seedAdminRole = (nk: ReturnType<typeof createNakama>, userId: string, role = "viewer") => {
  nk.storage.set(buildStorageKey(ADMIN_COLLECTION, ADMIN_ROLE_KEY, userId), {
    collection: ADMIN_COLLECTION,
    key: ADMIN_ROLE_KEY,
    userId,
    value: { role },
    version: "admin-role-v1",
  });
};

const seedRunIndex = (nk: ReturnType<typeof createNakama>, runIds: string[]) => {
  nk.storage.set(buildStorageKey(RUNS_COLLECTION, RUNS_INDEX_KEY), {
    collection: RUNS_COLLECTION,
    key: RUNS_INDEX_KEY,
    value: {
      runIds,
      updatedAt: "2026-03-30T12:00:00.000Z",
    },
    version: "index-v1",
  });
};

const seedRun = (
  nk: ReturnType<typeof createNakama>,
  runId: string,
  value: Record<string, unknown>,
) => {
  nk.storage.set(buildStorageKey(RUNS_COLLECTION, runId), {
    collection: RUNS_COLLECTION,
    key: runId,
    value,
    version: `${runId}-v1`,
  });
};

const seedAuditLog = (
  nk: ReturnType<typeof createNakama>,
  entries: Array<Record<string, unknown>>,
) => {
  nk.storage.set(buildStorageKey(TOURNAMENT_AUDIT_COLLECTION, TOURNAMENT_AUDIT_LOG_KEY), {
    collection: TOURNAMENT_AUDIT_COLLECTION,
    key: TOURNAMENT_AUDIT_LOG_KEY,
    value: {
      entries,
      updatedAt: "2026-03-30T12:00:00.000Z",
    },
    version: "audit-v1",
  });
};

describe("rpcAdminGetTournamentLiveStatus", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-03-30T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("summarizes open, active, stale, finalize-ready, and finalized runs for overview", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1");

    const registrations = [
      {
        userId: "user-1",
        displayName: "Seed 1",
        joinedAt: "2026-03-30T11:00:00.000Z",
        seed: 1,
      },
      {
        userId: "user-2",
        displayName: "Seed 2",
        joinedAt: "2026-03-30T11:01:00.000Z",
        seed: 2,
      },
    ];
    const staleBracket = createSingleEliminationBracket(registrations, "2026-03-30T11:05:00.000Z");
    staleBracket.entries[0] = {
      ...staleBracket.entries[0],
      status: "ready",
      readyAt: "2026-03-30T11:20:00.000Z",
      updatedAt: "2026-03-30T11:20:00.000Z",
    };

    const activeBracket = createSingleEliminationBracket(registrations, "2026-03-30T11:10:00.000Z");
    activeBracket.entries[0] = {
      ...activeBracket.entries[0],
      status: "in_match",
      matchId: "active-match",
      startedAt: "2026-03-30T11:55:00.000Z",
      updatedAt: "2026-03-30T11:55:00.000Z",
    };
    activeBracket.participants = activeBracket.participants.map((participant) => ({
      ...participant,
      state: "in_match",
      activeMatchId: "active-match",
      updatedAt: "2026-03-30T11:55:00.000Z",
    }));

    const finalizeReadyBracket = completeTournamentBracketMatch(
      createSingleEliminationBracket(registrations, "2026-03-30T11:15:00.000Z"),
      {
        entryId: "round-1-match-1",
        matchId: "finalize-ready-match",
        winnerUserId: "user-1",
        loserUserId: "user-2",
        completedAt: "2026-03-30T11:45:00.000Z",
      },
    );

    const finalizedBracket = completeTournamentBracketMatch(
      createSingleEliminationBracket(registrations, "2026-03-30T11:20:00.000Z"),
      {
        entryId: "round-1-match-1",
        matchId: "finalized-match",
        winnerUserId: "user-1",
        loserUserId: "user-2",
        completedAt: "2026-03-30T11:35:00.000Z",
      },
    );

    seedRunIndex(nk, [
      "starting-soon-run",
      "stale-run",
      "active-run",
      "finalize-ready-run",
      "finalized-run",
    ]);
    seedRun(nk, "starting-soon-run", {
      runId: "starting-soon-run",
      tournamentId: "starting-soon-run",
      title: "Starting Soon",
      description: "Draft run",
      category: 0,
      authoritative: true,
      sortOrder: "desc",
      operator: "incr",
      resetSchedule: "",
      metadata: {},
      startTime: Math.floor(new Date("2026-03-30T12:30:00.000Z").getTime() / 1000),
      endTime: Math.floor(new Date("2026-03-30T14:30:00.000Z").getTime() / 1000),
      duration: 7200,
      maxSize: 8,
      maxNumScore: 3,
      joinRequired: true,
      enableRanks: true,
      lifecycle: "draft",
      createdAt: "2026-03-30T11:40:00.000Z",
      updatedAt: "2026-03-30T11:50:00.000Z",
      createdByUserId: "admin-1",
      createdByLabel: "Admin",
      openedAt: null,
      closedAt: null,
      finalizedAt: null,
      finalSnapshot: null,
      registrations: registrations.concat([
        {
          userId: "user-3",
          displayName: "Seed 3",
          joinedAt: "2026-03-30T11:02:00.000Z",
          seed: 3,
        },
      ]),
      bracket: null,
    });
    seedRun(nk, "stale-run", {
      runId: "stale-run",
      tournamentId: "stale-run",
      title: "Stale Run",
      description: "Ready too long",
      category: 0,
      authoritative: true,
      sortOrder: "desc",
      operator: "incr",
      resetSchedule: "",
      metadata: {},
      startTime: Math.floor(new Date("2026-03-30T11:00:00.000Z").getTime() / 1000),
      endTime: Math.floor(new Date("2026-03-30T13:00:00.000Z").getTime() / 1000),
      duration: 7200,
      maxSize: 2,
      maxNumScore: 1,
      joinRequired: true,
      enableRanks: true,
      lifecycle: "open",
      createdAt: "2026-03-30T10:55:00.000Z",
      updatedAt: "2026-03-30T11:20:00.000Z",
      createdByUserId: "admin-1",
      createdByLabel: "Admin",
      openedAt: "2026-03-30T11:00:00.000Z",
      closedAt: null,
      finalizedAt: null,
      finalSnapshot: null,
      registrations,
      bracket: staleBracket,
    });
    seedRun(nk, "active-run", {
      runId: "active-run",
      tournamentId: "active-run",
      title: "Active Run",
      description: "In progress",
      category: 0,
      authoritative: true,
      sortOrder: "desc",
      operator: "incr",
      resetSchedule: "",
      metadata: {},
      startTime: Math.floor(new Date("2026-03-30T11:00:00.000Z").getTime() / 1000),
      endTime: Math.floor(new Date("2026-03-30T13:00:00.000Z").getTime() / 1000),
      duration: 7200,
      maxSize: 2,
      maxNumScore: 1,
      joinRequired: true,
      enableRanks: true,
      lifecycle: "open",
      createdAt: "2026-03-30T10:58:00.000Z",
      updatedAt: "2026-03-30T11:55:00.000Z",
      createdByUserId: "admin-1",
      createdByLabel: "Admin",
      openedAt: "2026-03-30T11:00:00.000Z",
      closedAt: null,
      finalizedAt: null,
      finalSnapshot: null,
      registrations,
      bracket: activeBracket,
    });
    seedRun(nk, "finalize-ready-run", {
      runId: "finalize-ready-run",
      tournamentId: "finalize-ready-run",
      title: "Finalize Ready",
      description: "Completed but not finalized",
      category: 0,
      authoritative: true,
      sortOrder: "desc",
      operator: "incr",
      resetSchedule: "",
      metadata: {},
      startTime: Math.floor(new Date("2026-03-30T11:00:00.000Z").getTime() / 1000),
      endTime: Math.floor(new Date("2026-03-30T13:00:00.000Z").getTime() / 1000),
      duration: 7200,
      maxSize: 2,
      maxNumScore: 1,
      joinRequired: true,
      enableRanks: true,
      lifecycle: "closed",
      createdAt: "2026-03-30T10:58:00.000Z",
      updatedAt: "2026-03-30T11:45:00.000Z",
      createdByUserId: "admin-1",
      createdByLabel: "Admin",
      openedAt: "2026-03-30T11:00:00.000Z",
      closedAt: "2026-03-30T11:45:00.000Z",
      finalizedAt: null,
      finalSnapshot: null,
      registrations,
      bracket: finalizeReadyBracket,
    });
    seedRun(nk, "finalized-run", {
      runId: "finalized-run",
      tournamentId: "finalized-run",
      title: "Finalized Run",
      description: "Archived",
      category: 0,
      authoritative: true,
      sortOrder: "desc",
      operator: "incr",
      resetSchedule: "",
      metadata: {},
      startTime: Math.floor(new Date("2026-03-30T11:00:00.000Z").getTime() / 1000),
      endTime: Math.floor(new Date("2026-03-30T13:00:00.000Z").getTime() / 1000),
      duration: 7200,
      maxSize: 2,
      maxNumScore: 1,
      joinRequired: true,
      enableRanks: true,
      lifecycle: "finalized",
      createdAt: "2026-03-30T10:58:00.000Z",
      updatedAt: "2026-03-30T11:40:00.000Z",
      createdByUserId: "admin-1",
      createdByLabel: "Admin",
      openedAt: "2026-03-30T11:00:00.000Z",
      closedAt: "2026-03-30T11:35:00.000Z",
      finalizedAt: "2026-03-30T11:40:00.000Z",
      finalSnapshot: null,
      registrations,
      bracket: finalizedBracket,
    });

    seedAuditLog(nk, [
      {
        id: "audit-stale",
        action: "rpc_admin_open_tournament",
        userId: "admin-1",
        actorUserId: "admin-1",
        actorLabel: "Admin",
        targetId: "stale-run",
        tournamentId: "stale-run",
        tournamentName: "Stale Run",
        createdAt: "2026-03-30T11:20:00.000Z",
        timestamp: "2026-03-30T11:20:00.000Z",
        metadata: {},
      },
      {
        id: "audit-finalize-ready",
        action: "match.recorded",
        userId: "admin-1",
        actorUserId: "admin-1",
        actorLabel: "Admin",
        targetId: "finalize-ready-run",
        tournamentId: "finalize-ready-run",
        tournamentName: "Finalize Ready",
        createdAt: "2026-03-30T11:45:00.000Z",
        timestamp: "2026-03-30T11:45:00.000Z",
        metadata: {},
      },
    ]);

    nk.tournaments.set("starting-soon-run", {
      id: "starting-soon-run",
      size: 3,
      maxSize: 8,
      startTime: Math.floor(new Date("2026-03-30T12:30:00.000Z").getTime() / 1000),
    });
    nk.tournaments.set("stale-run", {
      id: "stale-run",
      size: 2,
      maxSize: 2,
      startTime: Math.floor(new Date("2026-03-30T11:00:00.000Z").getTime() / 1000),
    });
    nk.tournaments.set("active-run", {
      id: "active-run",
      size: 2,
      maxSize: 2,
      startTime: Math.floor(new Date("2026-03-30T11:00:00.000Z").getTime() / 1000),
    });
    nk.tournaments.set("finalize-ready-run", {
      id: "finalize-ready-run",
      size: 2,
      maxSize: 2,
      startTime: Math.floor(new Date("2026-03-30T11:00:00.000Z").getTime() / 1000),
    });
    nk.tournaments.set("finalized-run", {
      id: "finalized-run",
      size: 2,
      maxSize: 2,
      startTime: Math.floor(new Date("2026-03-30T11:00:00.000Z").getTime() / 1000),
    });

    const response = JSON.parse(
      rpcAdminGetTournamentLiveStatus(
        {
          userId: "admin-1",
          username: "Admin",
        },
        logger,
        nk,
        JSON.stringify({}),
      ),
    ) as {
      summaries: Array<{
        runId: string;
        lifecycle: string;
        activeMatches: number;
        startingSoon: boolean;
        finalizeReady: boolean;
        actionNeeded: boolean;
        alerts: Array<{ code: string }>;
      }>;
    };

    expect(response.summaries[0].runId).toBe("stale-run");
    expect(response.summaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          runId: "stale-run",
          lifecycle: "open",
          actionNeeded: true,
          alerts: expect.arrayContaining([expect.objectContaining({ code: "stale_match" })]),
        }),
        expect.objectContaining({
          runId: "active-run",
          activeMatches: 1,
          alerts: expect.arrayContaining([expect.objectContaining({ code: "active_matches" })]),
        }),
        expect.objectContaining({
          runId: "finalize-ready-run",
          lifecycle: "closed",
          finalizeReady: true,
          alerts: expect.arrayContaining([expect.objectContaining({ code: "finalize_ready" })]),
        }),
        expect.objectContaining({
          runId: "finalized-run",
          lifecycle: "finalized",
          finalizeReady: false,
          alerts: expect.arrayContaining([expect.objectContaining({ code: "finalized" })]),
        }),
        expect.objectContaining({
          runId: "starting-soon-run",
          startingSoon: true,
          alerts: expect.arrayContaining([expect.objectContaining({ code: "starting_soon" })]),
        }),
      ]),
    );
  });

  it("returns live detail stats, queue rows, stale states, and graph buckets for a run", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1");

    const startedAt = "2026-03-30T11:00:00.000Z";
    const registrations = [
      {
        userId: "user-1",
        displayName: "Seed 1",
        joinedAt: startedAt,
        seed: 1,
      },
      {
        userId: "user-2",
        displayName: "Seed 2",
        joinedAt: startedAt,
        seed: 2,
      },
      {
        userId: "user-3",
        displayName: "Seed 3",
        joinedAt: startedAt,
        seed: 3,
      },
      {
        userId: "user-4",
        displayName: "Seed 4",
        joinedAt: startedAt,
        seed: 4,
      },
    ];

    const bracket = createSingleEliminationBracket(registrations, startedAt);
    const firstEntry = bracket.entries.find((entry) => entry.entryId === "round-1-match-1");
    const firstWinnerUserId = firstEntry?.playerAUserId ?? null;
    const firstLoserUserId = firstEntry?.playerBUserId ?? null;

    if (!firstWinnerUserId || !firstLoserUserId) {
      throw new Error("Expected seeded first-round entry assignments for the live detail test.");
    }

    const afterFirstResult = completeTournamentBracketMatch(bracket, {
      entryId: "round-1-match-1",
      matchId: "match-1",
      winnerUserId: firstWinnerUserId,
      loserUserId: firstLoserUserId,
      completedAt: "2026-03-30T11:40:00.000Z",
    });
    const secondEntry = afterFirstResult.entries.find((entry) => entry.entryId === "round-1-match-2");
    const secondEntryPlayerIds = [secondEntry?.playerAUserId, secondEntry?.playerBUserId].filter(
      (userId): userId is string => Boolean(userId),
    );

    const updatedBracket = {
      ...afterFirstResult,
      participants: afterFirstResult.participants.map((participant) => {
        if (secondEntryPlayerIds.includes(participant.userId)) {
          return {
            ...participant,
            state: "in_match",
            activeMatchId: "match-2",
            updatedAt: "2026-03-30T11:20:00.000Z",
          };
        }

        if (participant.userId === "user-1") {
          return {
            ...participant,
            state: "waiting_next_round",
            updatedAt: "2026-03-30T11:40:00.000Z",
          };
        }

        return participant;
      }),
      entries: afterFirstResult.entries.map((entry) => {
        if (entry.entryId === "round-1-match-2") {
          return {
            ...entry,
            status: "in_match" as const,
            matchId: "match-2",
            startedAt: "2026-03-30T11:20:00.000Z",
            updatedAt: "2026-03-30T11:20:00.000Z",
          };
        }

        return entry;
      }),
    };

    seedRunIndex(nk, ["detail-run"]);
    seedRun(nk, "detail-run", {
      runId: "detail-run",
      tournamentId: "detail-run",
      title: "Detail Run",
      description: "Mixed bracket state",
      category: 0,
      authoritative: true,
      sortOrder: "desc",
      operator: "incr",
      resetSchedule: "",
      metadata: {},
      startTime: Math.floor(new Date(startedAt).getTime() / 1000),
      endTime: Math.floor(new Date("2026-03-30T13:00:00.000Z").getTime() / 1000),
      duration: 7200,
      maxSize: 4,
      maxNumScore: 2,
      joinRequired: true,
      enableRanks: true,
      lifecycle: "open",
      createdAt: "2026-03-30T10:58:00.000Z",
      updatedAt: "2026-03-30T11:40:00.000Z",
      createdByUserId: "admin-1",
      createdByLabel: "Admin",
      openedAt: startedAt,
      closedAt: null,
      finalizedAt: null,
      finalSnapshot: null,
      registrations,
      bracket: updatedBracket,
    });
    seedAuditLog(nk, [
      {
        id: "audit-detail",
        action: "match.recorded",
        userId: "admin-1",
        actorUserId: "admin-1",
        actorLabel: "Admin",
        targetId: "detail-run",
        tournamentId: "detail-run",
        tournamentName: "Detail Run",
        createdAt: "2026-03-30T11:40:00.000Z",
        timestamp: "2026-03-30T11:40:00.000Z",
        metadata: {},
      },
    ]);

    nk.tournaments.set("detail-run", {
      id: "detail-run",
      size: 4,
      maxSize: 4,
      startTime: Math.floor(new Date(startedAt).getTime() / 1000),
    });

    const response = JSON.parse(
      rpcAdminGetTournamentLiveStatus(
        {
          userId: "admin-1",
          username: "Admin",
        },
        logger,
        nk,
        JSON.stringify({
          runId: "detail-run",
        }),
      ),
    ) as {
      summary: {
        currentRound: number | null;
        activeMatches: number;
        waitingPlayers: number;
      };
      roundStats: Array<{
        round: number;
        completed: number;
        inMatch: number;
        pending: number;
      }>;
      participantStateCounts: {
        waitingNextRound: number;
        inMatch: number;
        eliminated: number;
      };
      liveEntries: Array<{
        entryId: string;
        stale: boolean;
        staleReason: string | null;
        blockedReason: string | null;
      }>;
      matchDurationBuckets: Array<{ label: string; count: number }>;
      seedSurvival: Array<{ round: number; survivingCount: number; topSeedRemaining: number | null }>;
      auditActivityTimeline: Array<{ count: number }>;
    };

    expect(response.summary).toEqual(
      expect.objectContaining({
        currentRound: 1,
        activeMatches: 1,
        waitingPlayers: 1,
      }),
    );
    expect(response.roundStats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          round: 1,
          completed: 1,
          inMatch: 1,
        }),
        expect.objectContaining({
          round: 2,
          pending: 1,
        }),
      ]),
    );
    expect(response.participantStateCounts).toEqual(
      expect.objectContaining({
        waitingNextRound: 1,
        inMatch: 2,
        eliminated: 1,
      }),
    );
    expect(response.liveEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entryId: "round-1-match-2",
          stale: true,
          staleReason: expect.stringContaining("In match"),
        }),
        expect.objectContaining({
          entryId: "round-2-match-1",
          blockedReason: expect.stringContaining("waiting for an opponent"),
        }),
      ]),
    );
    expect(response.matchDurationBuckets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "<5m",
          count: 1,
        }),
      ]),
    );
    expect(response.seedSurvival).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          round: 1,
          survivingCount: 3,
          topSeedRemaining: 1,
        }),
      ]),
    );
    expect(response.auditActivityTimeline.reduce((total, bucket) => total + bucket.count, 0)).toBe(1);
  });
});

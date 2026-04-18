jest.mock("./progression", () => {
  const actual = jest.requireActual("./progression");
  const sharedProgression = jest.requireActual("../../shared/progression");

  return {
    ...actual,
    awardXpForMatchWin: jest.fn((_nk, _logger, params) => ({
      matchId: params.matchId,
      source: params.source,
      duplicate: false,
      awardedXp: 100,
      previousTotalXp: 0,
      newTotalXp: 100,
      previousRank: "Laborer",
      newRank: "Scribe",
      rankChanged: true,
      progression: sharedProgression.buildProgressionSnapshot(100),
    })),
  };
});

import "./index";
import { SOFT_CURRENCY_KEY } from "../../shared/wallet";

type StorageEntry = {
  collection: string;
  key: string;
  userId: string;
  version: string;
  value: unknown;
};

type RuntimeGlobals = typeof globalThis & {
  rpcCreateOpenOnlineMatch: (
    ctx: { userId?: string | null },
    logger: Record<string, jest.Mock>,
    nk: ReturnType<typeof createNakama>,
    payload: string,
  ) => string;
  rpcListOpenOnlineMatches: (
    ctx: { userId?: string | null },
    logger: Record<string, jest.Mock>,
    nk: ReturnType<typeof createNakama>,
    payload: string,
  ) => string;
  rpcListSpectatableMatches: (
    ctx: { userId?: string | null },
    logger: Record<string, jest.Mock>,
    nk: ReturnType<typeof createNakama>,
    payload: string,
  ) => string;
  rpcJoinOpenOnlineMatch: (
    ctx: { userId?: string | null },
    logger: Record<string, jest.Mock>,
    nk: ReturnType<typeof createNakama>,
    payload: string,
  ) => string;
  matchInit: (
    ctx: Record<string, unknown>,
    logger: Record<string, jest.Mock>,
    nk: ReturnType<typeof createNakama>,
    params: Record<string, unknown>,
  ) => { state: Record<string, any>; tickRate: number; label: string };
  matchLoop: (
    ctx: Record<string, unknown>,
    logger: Record<string, jest.Mock>,
    nk: ReturnType<typeof createNakama>,
    dispatcher: Record<string, jest.Mock>,
    tick: number,
    state: Record<string, any>,
    messages: unknown[],
  ) => { state: Record<string, any> };
};

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
const COLLECTION = "open_online_matches";

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

const createNakama = (initialWallets: Record<string, number> = {}) => {
  const storage = new Map<string, StorageEntry>();
  const wallets = new Map<string, number>(
    Object.entries(initialWallets).map(([userId, amount]) => [userId, amount]),
  );
  const storageKey = (collection: string, key: string, userId = SYSTEM_USER_ID) => `${collection}:${key}:${userId}`;

  return {
    storage,
    wallets,
    accountGetId: jest.fn((userId: string) => ({
      wallet: {
        [SOFT_CURRENCY_KEY]: wallets.get(userId) ?? 0,
      },
    })),
    storageRead: jest.fn((requests: { collection: string; key: string; userId?: string }[]) =>
      requests
        .map((request) => storage.get(storageKey(request.collection, request.key, request.userId ?? SYSTEM_USER_ID)))
        .filter(Boolean),
    ),
    storageWrite: jest.fn((writes: Array<{ collection: string; key: string; value: unknown; userId?: string; version?: string }>) => {
      writes.forEach((write) => {
        const userId = write.userId ?? SYSTEM_USER_ID;
        const key = storageKey(write.collection, write.key, userId);
        if (write.version === "*" && storage.has(key)) {
          throw new Error("Storage write rejected - version check failed.");
        }
        const current = storage.get(key);
        if (write.version && write.version !== "*" && current?.version !== write.version) {
          throw new Error("Storage write rejected - version check failed.");
        }
        storage.set(key, {
          collection: write.collection,
          key: write.key,
          userId,
          version: `version-${storage.size + 1}`,
          value: write.value,
        });
      });
    }),
    storageList: jest.fn((userId: string, collection: string) => ({
      objects: Array.from(storage.values()).filter(
        (entry) => entry.userId === userId && entry.collection === collection,
      ),
      cursor: null,
    })),
    matchCreate: jest.fn(() => "match-open-1"),
    walletUpdate: jest.fn((userId: string, changeset: Record<string, number>) => {
      const next = (wallets.get(userId) ?? 0) + (changeset[SOFT_CURRENCY_KEY] ?? 0);
      if (next < 0) {
        throw new Error("INSUFFICIENT_FUNDS");
      }
      wallets.set(userId, next);
    }),
    walletsUpdate: jest.fn((updates: Array<{ userId: string; changeset: Record<string, number> }>) => {
      updates.forEach((update) => {
        const next = (wallets.get(update.userId) ?? 0) + (update.changeset[SOFT_CURRENCY_KEY] ?? 0);
        if (next < 0) {
          throw new Error("INSUFFICIENT_FUNDS");
        }
        wallets.set(update.userId, next);
      });
    }),
  };
};

describe("open online match RPCs", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-04-18T10:00:00.000Z"));
    jest.spyOn(Math, "random").mockReturnValue(0.25);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects invalid wagers", () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama({ "creator-1": 100 });

    expect(() =>
      runtime.rpcCreateOpenOnlineMatch(
        { userId: "creator-1" },
        logger,
        nk,
        JSON.stringify({ wager: 15, durationMinutes: 5, modeId: "gameMode_3_pieces" }),
      ),
    ).toThrow("Wager must be between 10 and 100 coins in increments of 10.");
  });

  it("rejects creating when the creator cannot cover the wager", () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama({ "creator-1": 5 });

    expect(() =>
      runtime.rpcCreateOpenOnlineMatch(
        { userId: "creator-1" },
        logger,
        nk,
        JSON.stringify({ wager: 20, durationMinutes: 5, modeId: "gameMode_3_pieces" }),
      ),
    ).toThrow("INSUFFICIENT_FUNDS");
    expect(nk.wallets.get("creator-1")).toBe(5);
  });

  it("deducts creator escrow and publishes the open match", () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama({ "creator-1": 100 });

    const response = JSON.parse(
      runtime.rpcCreateOpenOnlineMatch(
        { userId: "creator-1" },
        logger,
        nk,
        JSON.stringify({ wager: 20, durationMinutes: 5, modeId: "gameMode_3_pieces" }),
      ),
    );

    expect(nk.wallets.get("creator-1")).toBe(80);
    expect(response.match).toEqual(
      expect.objectContaining({
        matchId: "match-open-1",
        wager: 20,
        durationMinutes: 5,
        status: "open",
        isCreator: true,
      }),
    );
    expect(nk.matchCreate).toHaveBeenCalledWith(
      "authoritative_match",
      expect.objectContaining({
        playerIds: ["creator-1"],
        openOnlineMatchWager: 20,
      }),
    );
  });

  it("prevents self-join, deducts joiner escrow, and marks the match as matched", () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama({ "creator-1": 100, "joiner-1": 100 });
    const created = JSON.parse(
      runtime.rpcCreateOpenOnlineMatch(
        { userId: "creator-1" },
        logger,
        nk,
        JSON.stringify({ wager: 20, durationMinutes: 5, modeId: "gameMode_3_pieces" }),
      ),
    ).match;

    expect(() =>
      runtime.rpcJoinOpenOnlineMatch(
        { userId: "creator-1" },
        logger,
        nk,
        JSON.stringify({ openMatchId: created.openMatchId }),
      ),
    ).toThrow("You cannot join your own open match.");

    const joined = JSON.parse(
      runtime.rpcJoinOpenOnlineMatch(
        { userId: "joiner-1" },
        logger,
        nk,
        JSON.stringify({ openMatchId: created.openMatchId }),
      ),
    ).match;

    expect(nk.wallets.get("joiner-1")).toBe(80);
    expect(joined).toEqual(
      expect.objectContaining({
        openMatchId: created.openMatchId,
        joinedUserId: "joiner-1",
        status: "matched",
        entrants: 2,
      }),
    );
  });

  it("keeps matched open online games visible for spectating", () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama({ "creator-1": 100, "joiner-1": 100 });
    const created = JSON.parse(
      runtime.rpcCreateOpenOnlineMatch(
        { userId: "creator-1" },
        logger,
        nk,
        JSON.stringify({ wager: 20, durationMinutes: 5, modeId: "gameMode_3_pieces" }),
      ),
    ).match;

    runtime.rpcJoinOpenOnlineMatch(
      { userId: "joiner-1" },
      logger,
      nk,
      JSON.stringify({ openMatchId: created.openMatchId }),
    );

    const onlineMatches = JSON.parse(runtime.rpcListOpenOnlineMatches({ userId: "viewer-1" }, logger, nk, ""));
    expect(onlineMatches.matches).toEqual([
      expect.objectContaining({
        openMatchId: created.openMatchId,
        matchId: "match-open-1",
        status: "matched",
      }),
    ]);

    const spectatableMatches = JSON.parse(runtime.rpcListSpectatableMatches({ userId: "viewer-1" }, logger, nk, ""));
    expect(spectatableMatches.matches).toEqual([
      expect.objectContaining({
        matchId: "match-open-1",
        modeId: "gameMode_3_pieces",
      }),
    ]);
  });

  it("refunds expired unjoined matches while listing", () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama({ "creator-1": 80 });
    const expiredRecord = {
      openMatchId: "open-expired",
      matchId: "match-expired",
      modeId: "standard",
      creatorUserId: "creator-1",
      joinedUserId: null,
      wager: 20,
      durationMinutes: 3,
      status: "open",
      creatorEscrowRefunded: false,
      potPaidOut: false,
      createdAt: "2026-04-18T09:50:00.000Z",
      expiresAt: "2026-04-18T09:53:00.000Z",
      updatedAt: "2026-04-18T09:50:00.000Z",
    };

    nk.storage.set(`${COLLECTION}:open-expired:${SYSTEM_USER_ID}`, {
      collection: COLLECTION,
      key: "open-expired",
      userId: SYSTEM_USER_ID,
      version: "version-1",
      value: expiredRecord,
    });

    const response = JSON.parse(runtime.rpcListOpenOnlineMatches({ userId: "viewer-1" }, logger, nk, ""));

    expect(response.matches).toEqual([]);
    expect(nk.wallets.get("creator-1")).toBe(100);
    expect(nk.storage.get(`${COLLECTION}:open-expired:${SYSTEM_USER_ID}`)?.value).toEqual(
      expect.objectContaining({
        status: "expired",
        creatorEscrowRefunded: true,
      }),
    );
  });

  it("pays the wager pot to the winner when the authoritative match ends", () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama({ "winner-1": 0, "loser-1": 0 });
    const dispatcher = { broadcastMessage: jest.fn() };

    nk.storage.set(`${COLLECTION}:open-pot:${SYSTEM_USER_ID}`, {
      collection: COLLECTION,
      key: "open-pot",
      userId: SYSTEM_USER_ID,
      version: "version-1",
      value: {
        openMatchId: "open-pot",
        matchId: "match-pot",
        modeId: "standard",
        creatorUserId: "winner-1",
        joinedUserId: "loser-1",
        wager: 20,
        durationMinutes: 5,
        status: "matched",
        creatorEscrowRefunded: false,
        potPaidOut: false,
        createdAt: "2026-04-18T10:00:00.000Z",
        expiresAt: "2026-04-18T10:05:00.000Z",
        updatedAt: "2026-04-18T10:01:00.000Z",
      },
    });

    const initialized = runtime.matchInit(
      { matchId: "match-pot" },
      logger,
      nk,
      {
        playerIds: ["winner-1", "loser-1"],
        openOnlineMatchId: "open-pot",
        openOnlineMatchWager: 20,
        openOnlineMatchCreatorUserId: "winner-1",
        openOnlineMatchJoinerUserId: "loser-1",
        rankedMatch: false,
        allowsChallengeRewards: false,
      },
    );

    initialized.state.gameState.winner = "light";
    initialized.state.gameState.phase = "ended";

    runtime.matchLoop({ matchId: "match-pot" }, logger, nk, dispatcher, 0, initialized.state, []);

    expect(nk.walletUpdate).toHaveBeenCalledWith(
      "winner-1",
      { [SOFT_CURRENCY_KEY]: 40 },
      expect.objectContaining({
        source: "open_online_match_pot",
        openMatchId: "open-pot",
      }),
      true,
    );
    expect(nk.storage.get(`${COLLECTION}:open-pot:${SYSTEM_USER_ID}`)?.value).toEqual(
      expect.objectContaining({
        status: "settled",
        potPaidOut: true,
      }),
    );
  });
});

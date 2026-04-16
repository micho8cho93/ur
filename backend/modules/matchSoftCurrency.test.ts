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

type RuntimeGlobals = typeof globalThis & {
  matchInit: (
    ctx: Record<string, unknown>,
    logger: Record<string, jest.Mock>,
    nk: Record<string, jest.Mock>,
    params: Record<string, unknown>,
  ) => { state: Record<string, any>; tickRate: number; label: string };
  matchLoop: (
    ctx: Record<string, unknown>,
    logger: Record<string, jest.Mock>,
    nk: Record<string, jest.Mock>,
    dispatcher: Record<string, jest.Mock>,
    tick: number,
    state: Record<string, any>,
    messages: unknown[],
  ) => { state: Record<string, any> };
};

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const createNakama = () => ({
  storageRead: jest.fn(() => []),
  storageWrite: jest.fn(),
  walletsUpdate: jest.fn(),
});

describe("match-end soft currency rewards", () => {
  it("awards 15 Coins to the winner and 5 to the loser", () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = { broadcastMessage: jest.fn() };
    const initialized = runtime.matchInit(
      { matchId: "match-1" },
      logger,
      nk,
      {
        playerIds: ["winner-1", "loser-1"],
        allowsChallengeRewards: false,
      },
    );

    initialized.state.gameState.winner = "light";
    initialized.state.gameState.phase = "ended";

    const result = runtime.matchLoop({ matchId: "match-1" }, logger, nk, dispatcher, 0, initialized.state, []);

    expect(nk.walletsUpdate).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: "winner-1",
        changeset: { [SOFT_CURRENCY_KEY]: 15 },
      }),
      expect.objectContaining({
        userId: "loser-1",
        changeset: { [SOFT_CURRENCY_KEY]: 5 },
      }),
    ]);
    expect(result.state.matchEnd.softCurrencyAwarded).toBe(true);
  });

  it("skips wallet updates when the match end payload is already marked awarded", () => {
    const runtime = globalThis as RuntimeGlobals;
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = { broadcastMessage: jest.fn() };
    const initialized = runtime.matchInit(
      { matchId: "match-2" },
      logger,
      nk,
      {
        playerIds: ["winner-1", "loser-1"],
        allowsChallengeRewards: false,
      },
    );

    initialized.state.gameState.winner = "light";
    initialized.state.gameState.phase = "ended";
    initialized.state.matchEnd = {
      reason: "completed",
      winnerUserId: "winner-1",
      loserUserId: "loser-1",
      forfeitingUserId: null,
      softCurrencyAwarded: true,
      message: null,
    };

    runtime.matchLoop({ matchId: "match-2" }, logger, nk, dispatcher, 0, initialized.state, []);

    expect(nk.walletsUpdate).not.toHaveBeenCalled();
  });
});

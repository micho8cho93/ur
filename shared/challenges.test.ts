import { createInitialState } from "../logic/engine";
import { CHALLENGE_IDS, calculateComebackCheckpoint } from "./challenges";
import { evaluateChallengesForMatchSummary } from "../backend/modules/challenges";

const createMatchSummary = (overrides: Record<string, unknown> = {}) => ({
  matchId: "match-1",
  playerUserId: "user-1",
  opponentType: "human" as const,
  opponentDifficulty: null,
  didWin: true,
  totalMoves: 72,
  playerMoveCount: 36,
  playerTurnCount: 36,
  opponentTurnCount: 35,
  piecesLost: 0,
  maxRollCount: 3,
  unusableRollCount: 0,
  capturesMade: 3,
  capturesSuffered: 0,
  captureTurnNumbers: [4, 6, 7],
  maxCaptureTurnStreak: 2,
  doubleStrikeAchieved: true,
  relentlessPressureAchieved: false,
  contestedTilesLandedCount: 4,
  opponentStartingAreaExitTurn: 3,
  lockdownAchieved: false,
  borneOffCount: 7,
  opponentBorneOffCount: 5,
  wasBehindDuringMatch: true,
  behindCheckpointCount: 2,
  behindReasons: ["progress_deficit"],
  opponentReachedBrink: false,
  momentumShiftAchieved: false,
  momentumShiftTurnSpan: null,
  maxActivePiecesOnBoard: 2,
  modeId: "standard" as const,
  pieceCountPerSide: 7,
  isPrivateMatch: false,
  isFriendMatch: false,
  isTournamentMatch: false,
  tournamentEliminationRisk: false,
  timestamp: "2026-03-19T12:00:00.000Z",
  ...overrides,
});

describe("challenge helpers", () => {
  it("flags deterministic comeback checkpoints when progress or borne-off deficit exists", () => {
    const state = createInitialState();
    state.light.pieces[0].position = 0;
    state.dark.pieces[0].position = 6;
    state.dark.finishedCount = 1;
    state.dark.pieces[1].position = 14;
    state.dark.pieces[1].isFinished = true;

    const checkpoint = calculateComebackCheckpoint(state, "light");

    expect(checkpoint.wasBehind).toBe(true);
    expect(checkpoint.reasons).toEqual(expect.arrayContaining(["progress_deficit", "borne_off_deficit"]));
  });

  it("evaluates the configured challenge list from a normalized summary", () => {
    const completed = evaluateChallengesForMatchSummary(
      createMatchSummary({
        opponentType: "hard_bot",
        opponentDifficulty: "hard",
      })
    );

    expect(completed).toEqual(
      expect.arrayContaining([
        CHALLENGE_IDS.FIRST_VICTORY,
        CHALLENGE_IDS.FAST_FINISH,
        CHALLENGE_IDS.SAFE_PLAY,
        CHALLENGE_IDS.LUCKY_ROLL,
        CHALLENGE_IDS.CAPTURE_MASTER,
        CHALLENGE_IDS.COMEBACK_WIN,
        CHALLENGE_IDS.RISK_TAKER,
        CHALLENGE_IDS.BEAT_HARD_BOT,
      ])
    );
    expect(completed).not.toContain(CHALLENGE_IDS.HOME_STRETCH);
    expect(completed).not.toContain(CHALLENGE_IDS.BEAT_PERFECT_BOT);
  });

  it("allows Capture Master without requiring a win", () => {
    const completed = evaluateChallengesForMatchSummary(
      createMatchSummary({
        matchId: "match-2",
        didWin: false,
        totalMoves: 112,
        playerMoveCount: 55,
        playerTurnCount: 55,
        opponentTurnCount: 56,
        piecesLost: 2,
        maxRollCount: 1,
        capturesMade: 3,
        capturesSuffered: 2,
        unusableRollCount: 1,
        captureTurnNumbers: [3, 7, 12],
        maxCaptureTurnStreak: 1,
        doubleStrikeAchieved: false,
        contestedTilesLandedCount: 1,
        borneOffCount: 5,
        opponentBorneOffCount: 7,
        wasBehindDuringMatch: false,
        behindCheckpointCount: 0,
        behindReasons: [],
        timestamp: "2026-03-19T12:05:00.000Z",
      })
    );

    expect(completed).toEqual([CHALLENGE_IDS.CAPTURE_MASTER]);
  });

  it("evaluates Perfect Path and No Waste pass/fail conditions", () => {
    const cleanMatch = evaluateChallengesForMatchSummary(
      createMatchSummary({
        contestedTilesLandedCount: 0,
        unusableRollCount: 0,
      })
    );
    const messyMatch = evaluateChallengesForMatchSummary(
      createMatchSummary({
        matchId: "match-3",
        contestedTilesLandedCount: 1,
        unusableRollCount: 2,
      })
    );

    expect(cleanMatch).toEqual(expect.arrayContaining([CHALLENGE_IDS.PERFECT_PATH, CHALLENGE_IDS.NO_WASTE]));
    expect(messyMatch).not.toContain(CHALLENGE_IDS.PERFECT_PATH);
    expect(messyMatch).not.toContain(CHALLENGE_IDS.NO_WASTE);
  });

  it("evaluates Double Strike, Lockdown, Relentless Pressure, and Unbreakable", () => {
    const completed = evaluateChallengesForMatchSummary(
      createMatchSummary({
        captureTurnNumbers: [2, 4, 5],
        maxCaptureTurnStreak: 3,
        doubleStrikeAchieved: true,
        relentlessPressureAchieved: true,
        opponentTurnCount: 10,
        opponentStartingAreaExitTurn: null,
        lockdownAchieved: true,
        capturesSuffered: 0,
      })
    );
    const failedDoubleStrike = evaluateChallengesForMatchSummary(
      createMatchSummary({
        matchId: "match-4",
        captureTurnNumbers: [2, 7],
        doubleStrikeAchieved: false,
        maxCaptureTurnStreak: 1,
        relentlessPressureAchieved: false,
        opponentTurnCount: 9,
        opponentStartingAreaExitTurn: null,
        lockdownAchieved: false,
      })
    );

    expect(completed).toEqual(
      expect.arrayContaining([
        CHALLENGE_IDS.DOUBLE_STRIKE,
        CHALLENGE_IDS.LOCKDOWN,
        CHALLENGE_IDS.RELENTLESS_PRESSURE,
        CHALLENGE_IDS.UNBREAKABLE,
      ])
    );
    expect(failedDoubleStrike).not.toContain(CHALLENGE_IDS.DOUBLE_STRIKE);
    expect(failedDoubleStrike).not.toContain(CHALLENGE_IDS.LOCKDOWN);
    expect(failedDoubleStrike).not.toContain(CHALLENGE_IDS.RELENTLESS_PRESSURE);
  });

  it("evaluates From the Brink, Momentum Shift, Silent Victory, and Shadow Player", () => {
    const completed = evaluateChallengesForMatchSummary(
      createMatchSummary({
        capturesMade: 0,
        opponentReachedBrink: true,
        momentumShiftAchieved: true,
        maxActivePiecesOnBoard: 1,
      })
    );

    expect(completed).toEqual(
      expect.arrayContaining([
        CHALLENGE_IDS.FROM_THE_BRINK,
        CHALLENGE_IDS.MOMENTUM_SHIFT,
        CHALLENGE_IDS.SILENT_VICTORY,
        CHALLENGE_IDS.SHADOW_PLAYER,
      ])
    );
  });

  it("evaluates mode, social, and perfect-bot mastery challenges", () => {
    const completed = evaluateChallengesForMatchSummary(
      createMatchSummary({
        opponentType: "perfect_bot",
        opponentDifficulty: "perfect",
        capturesMade: 0,
        capturesSuffered: 0,
        contestedTilesLandedCount: 0,
        pieceCountPerSide: 1,
        modeId: "gameMode_1_piece",
        playerTurnCount: 8,
        maxActivePiecesOnBoard: 1,
        isPrivateMatch: true,
        isFriendMatch: true,
      })
    );

    expect(completed).toEqual(
      expect.arrayContaining([
        CHALLENGE_IDS.SOLO_MASTER,
        CHALLENGE_IDS.SPEED_RUNNER,
        CHALLENGE_IDS.FRIENDLY_RIVALRY,
        CHALLENGE_IDS.MASTER_OF_UR,
      ])
    );
  });
});

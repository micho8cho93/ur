import type { MatchModeId } from "../../../logic/matchConfigs";
import type { PlayerColor } from "../../../logic/types";
import {
  MAX_WRITE_ATTEMPTS,
  RuntimeStorageObject,
  STORAGE_PERMISSION_NONE,
  asRecord,
  findStorageObject,
  getErrorMessage,
  getStorageObjectVersion,
  maybeSetStorageVersion,
} from "../progression";
import {
  completeTournamentBracketMatch,
  getTournamentBracketParticipant,
  type TournamentBracketParticipantState,
} from "./bracket";
import { readNumberField, readStringField } from "./definitions";
import {
  finalizeTournamentRun,
  getNakamaTournamentById,
  normalizeRunRecord,
  updateRunWithRetry,
  type FinalizeTournamentRunResult,
  type TournamentRunRecord,
} from "./admin";
import type { RuntimeLogger, RuntimeMetadata, RuntimeNakama } from "./types";

type RuntimeRecord = Record<string, unknown>;

type TournamentRecordWriteSummary = {
  userId: string;
  username: string | null;
  score: number;
  subscore: number;
  result: RuntimeMetadata | null;
};

export type TournamentMatchContext = {
  runId: string;
  tournamentId: string;
  round: number | null;
  entryId: string | null;
  eliminationRisk: boolean;
};

export type TournamentMatchClassification = {
  ranked: boolean;
  casual: boolean;
  private: boolean;
  bot: boolean;
  experimental: boolean;
};

export type TournamentMatchPlayerSummary = {
  userId: string;
  username: string | null;
  color: PlayerColor;
  didWin: boolean;
  score: number;
  finishedCount: number;
  capturesMade: number;
  capturesSuffered: number;
  playerMoveCount: number;
};

export type AuthoritativeTournamentMatchCompletion = {
  matchId: string;
  modeId: MatchModeId;
  context: TournamentMatchContext | null;
  completedAt: string;
  totalMoves: number;
  revision: number;
  winningColor: PlayerColor | null;
  winnerUserId: string | null;
  loserUserId: string | null;
  classification: TournamentMatchClassification;
  players: TournamentMatchPlayerSummary[];
};

export type TournamentMatchResultRecord = {
  resultId: string;
  matchId: string;
  runId: string;
  tournamentId: string;
  createdAt: string;
  updatedAt: string;
  valid: boolean;
  counted: boolean;
  invalidReason: string | null;
  summary: {
    modeId: MatchModeId;
    totalMoves: number;
    revision: number;
    completedAt: string;
    round: number | null;
    entryId: string | null;
    winningColor: PlayerColor | null;
    winnerUserId: string | null;
    loserUserId: string | null;
    classification: TournamentMatchClassification;
    players: TournamentMatchPlayerSummary[];
  };
  tournamentRecordWrites: TournamentRecordWriteSummary[];
  errorMessage: string | null;
};

export type TournamentMatchParticipantResolution = {
  userId: string;
  state: TournamentBracketParticipantState | null;
  finalPlacement: number | null;
};

export type TournamentMatchProcessResult = {
  skipped: boolean;
  duplicate: boolean;
  record: TournamentMatchResultRecord | null;
  updatedRun: TournamentRunRecord | null;
  participantResolutions: TournamentMatchParticipantResolution[];
  finalizationResult: FinalizeTournamentRunResult | null;
};

export const TOURNAMENT_RUNS_COLLECTION = "tournament_runs";
export const TOURNAMENT_MATCH_RESULTS_COLLECTION = "tournament_match_results";

const normalizeMetadata = (value: unknown): RuntimeMetadata => asRecord(value) ?? {};

const readTournamentRunState = (
  nk: RuntimeNakama,
  runId: string,
): { object: RuntimeStorageObject | null; value: RuntimeRecord | null; run: TournamentRunRecord | null } => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_RUNS_COLLECTION,
      key: runId,
    },
  ]) as RuntimeStorageObject[];
  const object = findStorageObject(objects, TOURNAMENT_RUNS_COLLECTION, runId);
  const value = asRecord(object?.value) ?? null;

  return {
    object,
    value,
    run: normalizeRunRecord(object?.value ?? null, runId),
  };
};

const readTournamentMatchResultObject = (
  nk: RuntimeNakama,
  resultId: string,
): RuntimeStorageObject | null => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION,
      key: resultId,
    },
  ]) as RuntimeStorageObject[];

  return findStorageObject(objects, TOURNAMENT_MATCH_RESULTS_COLLECTION, resultId);
};

const buildTournamentMatchResultId = (context: TournamentMatchContext, matchId: string): string =>
  `${context.runId}:${matchId}`;

const mapOperatorToOverride = (operator: TournamentRunRecord["operator"]): number => {
  if (operator === "best") {
    return 1;
  }

  if (operator === "set") {
    return 2;
  }

  if (operator === "incr") {
    return 3;
  }

  return 0;
};

const buildInvalidReason = (
  completion: AuthoritativeTournamentMatchCompletion,
  run: TournamentRunRecord | null,
): string | null => {
  if (!completion.winningColor || !completion.winnerUserId || !completion.loserUserId) {
    return "Match winner could not be determined.";
  }

  if (completion.players.length !== 2) {
    return "Tournament matches require exactly two assigned players.";
  }

  const distinctUserIds = new Set(
    completion.players
      .map((player) => player.userId.trim())
      .filter((userId) => userId.length > 0),
  );
  if (distinctUserIds.size !== 2) {
    return "Tournament matches require two distinct players.";
  }

  if (completion.classification.private) {
    return "Private matches do not count toward tournaments.";
  }

  if (completion.classification.bot) {
    return "Bot matches do not count toward tournaments.";
  }

  if (completion.classification.casual) {
    return "Casual matches do not count toward tournaments.";
  }

  if (completion.classification.experimental) {
    return "Experimental matches do not count toward tournaments.";
  }

  if (completion.totalMoves < 1) {
    return "Matches without at least one applied move do not count toward tournaments.";
  }

  if (!run) {
    return `Tournament run '${completion.context?.runId ?? ""}' was not found.`;
  }

  if (run.lifecycle !== "open") {
    return `Tournament run '${run.runId}' is not open.`;
  }

  if (!completion.context || completion.context.tournamentId !== run.tournamentId) {
    return "Tournament context did not match the configured Nakama tournament.";
  }

  return null;
};

const normalizeUsersArray = (value: unknown): RuntimeRecord[] =>
  Array.isArray(value)
    ? value.map((entry) => asRecord(entry) ?? {}).filter((entry) => Object.keys(entry).length > 0)
    : [];

const resolveUsernames = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  players: TournamentMatchPlayerSummary[],
): Record<string, string> => {
  const usernames: Record<string, string> = {};

  players.forEach((player) => {
    const trimmedUsername = player.username?.trim();
    if (trimmedUsername) {
      usernames[player.userId] = trimmedUsername;
    }
  });

  const unresolvedUserIds = players
    .map((player) => player.userId)
    .filter((userId) => userId.length > 0 && !usernames[userId]);

  if (unresolvedUserIds.length > 0 && typeof nk.usersGetId === "function") {
    try {
      const users = normalizeUsersArray(nk.usersGetId(unresolvedUserIds));
      users.forEach((user) => {
        const userId = readStringField(user, ["userId", "user_id", "id"]);
        const username = readStringField(user, ["username", "displayName", "display_name"]);
        if (userId && username) {
          usernames[userId] = username;
        }
      });
    } catch (error) {
      logger.warn(
        "Unable to resolve tournament usernames for %s: %s",
        unresolvedUserIds.join(","),
        getErrorMessage(error),
      );
    }
  }

  players.forEach((player) => {
    if (!usernames[player.userId]) {
      usernames[player.userId] = player.userId;
    }
  });

  return usernames;
};

const ensureTournamentJoined = (
  nk: RuntimeNakama,
  run: TournamentRunRecord,
  players: TournamentMatchPlayerSummary[],
  usernames: Record<string, string>,
): void => {
  if (!run.joinRequired) {
    return;
  }

  players.forEach((player) => {
    nk.tournamentJoin(run.tournamentId, player.userId, usernames[player.userId] ?? player.userId);
  });
};

const submitTournamentScores = (
  nk: RuntimeNakama,
  run: TournamentRunRecord,
  completion: AuthoritativeTournamentMatchCompletion,
  usernames: Record<string, string>,
): TournamentRecordWriteSummary[] => {
  const operatorOverride = mapOperatorToOverride(run.operator);

  return completion.players.map((player) => {
    const opponentUserId =
      completion.players.find((candidate) => candidate.userId !== player.userId)?.userId ?? null;
    const metadata: RuntimeMetadata = {
      matchId: completion.matchId,
      runId: run.runId,
      tournamentId: run.tournamentId,
      round: completion.context?.round ?? null,
      entryId: completion.context?.entryId ?? null,
      modeId: completion.modeId,
      totalMoves: completion.totalMoves,
      completedAt: completion.completedAt,
      opponentUserId,
      result: player.didWin ? "win" : "loss",
      winningColor: completion.winningColor,
      winnerUserId: completion.winnerUserId,
    };
    const record = nk.tournamentRecordWrite(
      run.tournamentId,
      player.userId,
      usernames[player.userId] ?? player.userId,
      player.score,
      player.finishedCount,
      metadata,
      operatorOverride,
    );

    return {
      userId: player.userId,
      username: usernames[player.userId] ?? null,
      score: player.score,
      subscore: player.finishedCount,
      result: asRecord(record) ?? null,
    };
  });
};

const writeTournamentMatchResultRecord = (
  nk: RuntimeNakama,
  record: TournamentMatchResultRecord,
): void => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION,
      key: record.resultId,
      value: record,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    }, null),
  ]);
};

const updateTournamentRunMetadata = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  runId: string,
  result: TournamentMatchResultRecord,
): void => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const currentState = readTournamentRunState(nk, runId);
    if (!currentState.object || !currentState.value) {
      return;
    }

    const currentMetadata = normalizeMetadata(currentState.value.metadata);
    const currentCount = Math.max(
      0,
      Math.floor(readNumberField(currentMetadata, ["countedMatchCount", "validMatchCount"]) ?? 0),
    );
    const nextMetadata: RuntimeMetadata = {
      ...currentMetadata,
      countedMatchCount: result.counted ? currentCount + 1 : currentCount,
      lastProcessedMatchId: result.matchId,
      lastProcessedResultId: result.resultId,
      lastProcessedAt: result.updatedAt,
      lastProcessedWasCounted: result.counted,
      lastProcessedReason: result.invalidReason ?? result.errorMessage,
      lastWinnerUserId: result.summary.winnerUserId,
    };
    const nextValue: RuntimeRecord = {
      ...currentState.value,
      updatedAt: result.updatedAt,
      metadata: nextMetadata,
    };

    try {
      nk.storageWrite([
        maybeSetStorageVersion({
          collection: TOURNAMENT_RUNS_COLLECTION,
          key: runId,
          value: nextValue,
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE,
        }, getStorageObjectVersion(currentState.object)),
      ]);
      return;
    } catch (error) {
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }

      logger.warn(
        "Retrying tournament run metadata update for %s after storage conflict: %s",
        runId,
        getErrorMessage(error),
      );
    }
  }
};

const readTournamentEntrantCount = (value: unknown): number => {
  const entrants = readNumberField(value, ["size", "maxSize", "max_size"]);
  return typeof entrants === "number" && Number.isFinite(entrants) ? Math.max(0, Math.floor(entrants)) : 0;
};

const updateTournamentRunBracket = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  completion: AuthoritativeTournamentMatchCompletion,
): TournamentRunRecord | null => {
  if (
    !completion.context ||
    !completion.winnerUserId ||
    !completion.loserUserId
  ) {
    return null;
  }

  return updateRunWithRetry(nk, logger, completion.context.runId, (current) => {
    if (!current.bracket) {
      return current;
    }

    const nextBracket = completeTournamentBracketMatch(current.bracket, {
      entryId: completion.context?.entryId ?? null,
      matchId: completion.matchId,
      winnerUserId: completion.winnerUserId ?? "",
      loserUserId: completion.loserUserId ?? "",
      completedAt: completion.completedAt,
    });

    return {
      ...current,
      updatedAt: completion.completedAt,
      bracket: nextBracket,
    };
  });
};

export const maybeAutoFinalizeTournamentRunById = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  runId: string,
): FinalizeTournamentRunResult | null => {
  const runState = readTournamentRunState(nk, runId);
  const run = runState.run;

  if (!run || run.lifecycle === "finalized") {
    return null;
  }

  if (run.bracket?.finalizedAt) {
    try {
      const result = finalizeTournamentRun(logger, nk, run.runId, {});
      logger.info(
        "Auto-finalized tournament run %s after bracket completion.",
        result.run.runId,
      );
      return result;
    } catch (error) {
      logger.warn(
        "Unable to auto-finalize tournament run %s after bracket completion: %s",
        run.runId,
        getErrorMessage(error),
      );
    }
    return null;
  }

  const countedMatchCount = Math.max(
    0,
    Math.floor(readNumberField(run.metadata, ["countedMatchCount", "validMatchCount"]) ?? 0),
  );
  const entrantCount = readTournamentEntrantCount(getNakamaTournamentById(nk, run.tournamentId));

  if (entrantCount < 2 || countedMatchCount < entrantCount - 1) {
    return null;
  }

  try {
    const result = finalizeTournamentRun(logger, nk, run.runId, {});
    logger.info(
      "Auto-finalized tournament run %s after %d counted matches for %d entrants.",
      result.run.runId,
      countedMatchCount,
      entrantCount,
    );
    return result;
  } catch (error) {
    logger.warn(
      "Unable to auto-finalize tournament run %s after match completion: %s",
      run.runId,
      getErrorMessage(error),
    );
  }

  return null;
};

const buildParticipantResolutions = (
  run: TournamentRunRecord | null,
  players: TournamentMatchPlayerSummary[],
): TournamentMatchParticipantResolution[] =>
  players.map((player) => {
    const participant = getTournamentBracketParticipant(run?.bracket ?? null, player.userId);

    return {
      userId: player.userId,
      state: participant?.state ?? null,
      finalPlacement: participant?.finalPlacement ?? null,
    };
  });

export const resolveTournamentMatchContextFromParams = (
  params: Record<string, unknown>,
): TournamentMatchContext | null => {
  const runId = readStringField(params, ["tournamentRunId", "tournament_run_id", "runId", "run_id"]);
  const tournamentId = readStringField(params, ["tournamentId", "tournament_id"]);

  if (!runId && !tournamentId) {
    return null;
  }

  const normalizedRunId = runId ?? tournamentId ?? null;
  if (!normalizedRunId) {
    return null;
  }

  const round = readNumberField(params, ["tournamentRound", "tournament_round", "round"]);

  return {
    runId: normalizedRunId,
    tournamentId: tournamentId ?? normalizedRunId,
    round: typeof round === "number" && Number.isFinite(round) ? Math.max(1, Math.floor(round)) : null,
    entryId:
      readStringField(params, [
        "tournamentEntryId",
        "tournament_entry_id",
        "tournamentMatchId",
        "tournament_match_id",
        "bracketMatchId",
        "bracket_match_id",
      ]) ?? null,
    eliminationRisk: params.tournamentEliminationRisk === true,
  };
};

export const processCompletedAuthoritativeTournamentMatch = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  completion: AuthoritativeTournamentMatchCompletion,
): TournamentMatchProcessResult => {
  if (!completion.context) {
    return {
      skipped: true,
      duplicate: false,
      record: null,
      updatedRun: null,
      participantResolutions: [],
      finalizationResult: null,
    };
  }

  const resultId = buildTournamentMatchResultId(completion.context, completion.matchId);
  if (readTournamentMatchResultObject(nk, resultId)) {
    logger.info("Skipping duplicate tournament result for %s", resultId);
    const duplicateRun = readTournamentRunState(nk, completion.context.runId).run;
    return {
      skipped: false,
      duplicate: true,
      record: null,
      updatedRun: duplicateRun,
      participantResolutions: buildParticipantResolutions(duplicateRun, completion.players),
      finalizationResult: null,
    };
  }

  const runState = readTournamentRunState(nk, completion.context.runId);
  const invalidReason = buildInvalidReason(completion, runState.run);
  let tournamentRecordWrites: TournamentRecordWriteSummary[] = [];
  let errorMessage: string | null = null;

  if (!invalidReason && runState.run) {
    try {
      const usernames = resolveUsernames(nk, logger, completion.players);
      ensureTournamentJoined(nk, runState.run, completion.players, usernames);
      tournamentRecordWrites = submitTournamentScores(nk, runState.run, completion, usernames);
    } catch (error) {
      errorMessage = getErrorMessage(error);
      logger.error(
        "Failed to submit tournament scores for run %s on match %s: %s",
        completion.context.runId,
        completion.matchId,
        errorMessage,
      );
    }
  }

  const record: TournamentMatchResultRecord = {
    resultId,
    matchId: completion.matchId,
    runId: completion.context.runId,
    tournamentId: runState.run?.tournamentId ?? completion.context.tournamentId,
    createdAt: completion.completedAt,
    updatedAt: new Date().toISOString(),
    valid: invalidReason === null,
    counted: invalidReason === null && errorMessage === null,
    invalidReason,
    summary: {
      modeId: completion.modeId,
      totalMoves: completion.totalMoves,
      revision: completion.revision,
      completedAt: completion.completedAt,
      round: completion.context.round,
      entryId: completion.context.entryId,
      winningColor: completion.winningColor,
      winnerUserId: completion.winnerUserId,
      loserUserId: completion.loserUserId,
      classification: completion.classification,
      players: completion.players.map((player) => ({
        ...player,
      })),
    },
    tournamentRecordWrites,
    errorMessage,
  };

  try {
    writeTournamentMatchResultRecord(nk, record);
  } catch (error) {
    if (readTournamentMatchResultObject(nk, resultId)) {
      logger.info("Skipping duplicate tournament result after concurrent write for %s", resultId);
      const duplicateRun = readTournamentRunState(nk, completion.context.runId).run;
      return {
        skipped: false,
        duplicate: true,
        record: null,
        updatedRun: duplicateRun,
        participantResolutions: buildParticipantResolutions(duplicateRun, completion.players),
        finalizationResult: null,
      };
    }

    throw error;
  }

  let updatedRun = runState.run;
  let finalizationResult: FinalizeTournamentRunResult | null = null;

  if (runState.run) {
    try {
      updateTournamentRunMetadata(nk, logger, runState.run.runId, record);
      if (record.counted) {
        updatedRun = updateTournamentRunBracket(nk, logger, completion) ?? updatedRun;
        finalizationResult = maybeAutoFinalizeTournamentRunById(nk, logger, runState.run.runId);
      }
    } catch (error) {
      logger.warn(
        "Unable to update tournament run metadata for %s after match %s: %s",
        runState.run.runId,
        completion.matchId,
        getErrorMessage(error),
      );
    }

    updatedRun =
      finalizationResult?.run ??
      readTournamentRunState(nk, runState.run.runId).run ??
      updatedRun;
  }

  return {
    skipped: false,
    duplicate: false,
    record,
    updatedRun,
    participantResolutions: buildParticipantResolutions(updatedRun, completion.players),
    finalizationResult,
  };
};

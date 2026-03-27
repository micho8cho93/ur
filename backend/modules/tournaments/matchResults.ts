import type { MatchModeId } from "../../logic/matchConfigs";
import type { PlayerColor } from "../../logic/types";
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
import { readNumberField, readStringField } from "./definitions";
import type { RuntimeLogger, RuntimeMetadata, RuntimeNakama } from "./types";

type TournamentOperator = "best" | "set" | "incr";
type TournamentRunLifecycle = "draft" | "open" | "closed" | "finalized";
type RuntimeRecord = Record<string, unknown>;

type TournamentRunSnapshot = {
  runId: string;
  tournamentId: string;
  title: string;
  lifecycle: TournamentRunLifecycle;
  operator: TournamentOperator;
  joinRequired: boolean;
  metadata: RuntimeMetadata;
  updatedAt: string;
};

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

export type TournamentMatchProcessResult = {
  skipped: boolean;
  duplicate: boolean;
  record: TournamentMatchResultRecord | null;
};

export const TOURNAMENT_RUNS_COLLECTION = "tournament_runs";
export const TOURNAMENT_MATCH_RESULTS_COLLECTION = "tournament_match_results";

const normalizeOperator = (value: unknown): TournamentOperator => {
  if (value === "set" || value === "incr" || value === "best") {
    return value;
  }

  return "best";
};

const normalizeRunLifecycle = (value: unknown): TournamentRunLifecycle => {
  if (value === "draft" || value === "open" || value === "closed" || value === "finalized") {
    return value;
  }

  return "draft";
};

const normalizeMetadata = (value: unknown): RuntimeMetadata => asRecord(value) ?? {};

const normalizeRunSnapshot = (value: unknown, fallbackRunId: string): TournamentRunSnapshot | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const runId = readStringField(record, ["runId", "run_id"]) ?? fallbackRunId;
  const tournamentId = readStringField(record, ["tournamentId", "tournament_id"]) ?? runId;
  const title = readStringField(record, ["title"]);
  const updatedAt = readStringField(record, ["updatedAt", "updated_at"]);

  if (!runId || !tournamentId || !title || !updatedAt) {
    return null;
  }

  return {
    runId,
    tournamentId,
    title,
    lifecycle: normalizeRunLifecycle(readStringField(record, ["lifecycle"]) ?? "draft"),
    operator: normalizeOperator(readStringField(record, ["operator"]) ?? "best"),
    joinRequired: record.joinRequired !== false,
    metadata: normalizeMetadata(record.metadata),
    updatedAt,
  };
};

const readTournamentRunState = (
  nk: RuntimeNakama,
  runId: string,
): { object: RuntimeStorageObject | null; value: RuntimeRecord | null; run: TournamentRunSnapshot | null } => {
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
    run: normalizeRunSnapshot(object?.value ?? null, runId),
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

const mapOperatorToOverride = (operator: TournamentOperator): number => {
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
  run: TournamentRunSnapshot | null,
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
  run: TournamentRunSnapshot,
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
  run: TournamentRunSnapshot,
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
    }),
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
    };
  }

  const resultId = buildTournamentMatchResultId(completion.context, completion.matchId);
  if (readTournamentMatchResultObject(nk, resultId)) {
    logger.info("Skipping duplicate tournament result for %s", resultId);
    return {
      skipped: false,
      duplicate: true,
      record: null,
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
      return {
        skipped: false,
        duplicate: true,
        record: null,
      };
    }

    throw error;
  }

  if (runState.run) {
    try {
      updateTournamentRunMetadata(nk, logger, runState.run.runId, record);
    } catch (error) {
      logger.warn(
        "Unable to update tournament run metadata for %s after match %s: %s",
        runState.run.runId,
        completion.matchId,
        getErrorMessage(error),
      );
    }
  }

  return {
    skipped: false,
    duplicate: false,
    record,
  };
};

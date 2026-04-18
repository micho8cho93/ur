import { DEFAULT_BOT_DIFFICULTY } from "../../../logic/bot/types";
import {
  buildTournamentBotDisplayNames,
  isTournamentBotUserId,
  normalizeTournamentBotPolicy,
} from "../../../shared/tournamentBots";
import {
  MAX_WRITE_ATTEMPTS,
  RuntimeStorageObject,
  STORAGE_PERMISSION_NONE,
  asRecord,
  findStorageObject,
  getStorageObjectVersion,
  maybeSetStorageVersion,
} from "../progression";
import {
  getTournamentBracketCurrentRound,
  getTournamentBracketEntry,
  getTournamentBracketEntryByMatchId,
  getTournamentBracketParticipant,
  startTournamentBracketMatch,
  type TournamentBracketEntry,
  type TournamentBracketParticipant,
} from "./bracket";
import { readNumberField, readStringField, resolveTournamentXpRewardSettings } from "./definitions";
import { updateRunWithRetry, type TournamentRunRecord } from "./admin";
import type { RuntimeLogger, RuntimeNakama } from "./types";

export const TOURNAMENT_PARTICIPANT_FLOWS_COLLECTION = "tournament_participant_flows";

export type TournamentParticipantFlowState =
  | "registered"
  | "pending_match"
  | "in_match"
  | "waiting_next_round"
  | "eliminated"
  | "completed";

export type TournamentParticipantPendingDestination =
  | {
      type: "match";
      matchId: string;
      round: number | null;
    }
  | {
      type: "waiting_room";
      round: number | null;
    };

export type TournamentParticipantFlowRecord = {
  runId: string;
  tournamentId: string;
  userId: string;
  state: TournamentParticipantFlowState;
  currentRound: number | null;
  currentMatchId: string | null;
  pendingDestination: TournamentParticipantPendingDestination | null;
  createdAt: string;
  updatedAt: string;
};

export type TournamentParticipantFlowResponse = TournamentParticipantFlowRecord & {
  tournamentName: string;
  gameMode: string;
};

const normalizeFlowState = (value: unknown): TournamentParticipantFlowState => {
  if (
    value === "registered" ||
    value === "pending_match" ||
    value === "in_match" ||
    value === "waiting_next_round" ||
    value === "eliminated" ||
    value === "completed"
  ) {
    return value;
  }

  return "registered";
};

const normalizePendingDestination = (value: unknown): TournamentParticipantPendingDestination | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const type = readStringField(record, ["type"]);
  const round = readNumberField(record, ["round"]);
  const normalizedRound = typeof round === "number" && Number.isFinite(round) ? Math.max(1, Math.floor(round)) : null;

  if (type === "match") {
    const matchId = readStringField(record, ["matchId", "match_id"]);
    return matchId ? { type: "match", matchId, round: normalizedRound } : null;
  }

  if (type === "waiting_room") {
    return { type: "waiting_room", round: normalizedRound };
  }

  return null;
};

export const normalizeTournamentParticipantFlow = (
  value: unknown,
  fallbackRunId: string,
  fallbackUserId: string,
): TournamentParticipantFlowRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const runId = readStringField(record, ["runId", "run_id"]) ?? fallbackRunId;
  const tournamentId = readStringField(record, ["tournamentId", "tournament_id"]) ?? runId;
  const userId = readStringField(record, ["userId", "user_id"]) ?? fallbackUserId;
  const createdAt = readStringField(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField(record, ["updatedAt", "updated_at"]) ?? createdAt;
  const currentRound = readNumberField(record, ["currentRound", "current_round"]);

  if (!runId || !tournamentId || !userId || !createdAt || !updatedAt) {
    return null;
  }

  return {
    runId,
    tournamentId,
    userId,
    state: normalizeFlowState(readStringField(record, ["state"])),
    currentRound: typeof currentRound === "number" && Number.isFinite(currentRound)
      ? Math.max(1, Math.floor(currentRound))
      : null,
    currentMatchId: readStringField(record, ["currentMatchId", "current_match_id"]),
    pendingDestination: normalizePendingDestination(record.pendingDestination ?? record.pending_destination),
    createdAt,
    updatedAt,
  };
};

const readParticipantFlowObject = (
  nk: RuntimeNakama,
  runId: string,
  userId: string,
): RuntimeStorageObject | null => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_PARTICIPANT_FLOWS_COLLECTION,
      key: runId,
      userId,
    },
  ]) as RuntimeStorageObject[];

  return findStorageObject(objects, TOURNAMENT_PARTICIPANT_FLOWS_COLLECTION, runId, userId);
};

export const readTournamentParticipantFlow = (
  nk: RuntimeNakama,
  runId: string,
  userId: string,
): TournamentParticipantFlowRecord | null =>
  normalizeTournamentParticipantFlow(readParticipantFlowObject(nk, runId, userId)?.value ?? null, runId, userId);

const writeParticipantFlow = (
  nk: RuntimeNakama,
  record: TournamentParticipantFlowRecord,
  version: string | null = null,
): void => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: TOURNAMENT_PARTICIPANT_FLOWS_COLLECTION,
      key: record.runId,
      userId: record.userId,
      value: record,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    }, version),
  ]);
};

export const upsertTournamentParticipantFlow = (
  nk: RuntimeNakama,
  run: TournamentRunRecord,
  userId: string,
  derive: (existing: TournamentParticipantFlowRecord | null, now: string) => TournamentParticipantFlowRecord,
): TournamentParticipantFlowRecord => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const object = readParticipantFlowObject(nk, run.runId, userId);
    const existing = normalizeTournamentParticipantFlow(object?.value ?? null, run.runId, userId);
    const nextRecord = derive(existing, new Date().toISOString());

    try {
      writeParticipantFlow(nk, nextRecord, getStorageObjectVersion(object) ?? null);
      return nextRecord;
    } catch (error) {
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
    }
  }

  throw new Error(`Unable to store tournament participant flow for '${run.runId}' and '${userId}'.`);
};

const getRunGameMode = (run: TournamentRunRecord): string =>
  readStringField(run.metadata, ["gameMode", "game_mode"]) ?? "standard";

const createFlowRecord = (
  run: TournamentRunRecord,
  userId: string,
  state: TournamentParticipantFlowState,
  currentRound: number | null,
  currentMatchId: string | null,
  pendingDestination: TournamentParticipantPendingDestination | null,
  existing: TournamentParticipantFlowRecord | null,
  now: string,
): TournamentParticipantFlowRecord => ({
  runId: run.runId,
  tournamentId: run.tournamentId,
  userId,
  state,
  currentRound,
  currentMatchId,
  pendingDestination,
  createdAt: existing?.createdAt ?? now,
  updatedAt: now,
});

export const setRegisteredTournamentParticipantFlow = (
  nk: RuntimeNakama,
  run: TournamentRunRecord,
  userId: string,
): TournamentParticipantFlowRecord =>
  upsertTournamentParticipantFlow(nk, run, userId, (existing, now) =>
    createFlowRecord(run, userId, "registered", 1, null, null, existing, now),
  );

const isHumanParticipant = (userId: string | null | undefined): userId is string =>
  Boolean(userId && !isTournamentBotUserId(userId));

const getEntryHumanParticipants = (entry: TournamentBracketEntry): string[] =>
  [entry.playerAUserId, entry.playerBUserId].filter(isHumanParticipant);

const getEntryBotOpponent = (entry: TournamentBracketEntry, userId: string): string | null => {
  if (isTournamentBotUserId(entry.playerAUserId) && entry.playerAUserId !== userId) {
    return entry.playerAUserId;
  }

  if (isTournamentBotUserId(entry.playerBUserId) && entry.playerBUserId !== userId) {
    return entry.playerBUserId;
  }

  return null;
};

const ensureTournamentMatchForEntry = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  run: TournamentRunRecord,
  entry: TournamentBracketEntry,
  requestedByUserId: string,
): TournamentRunRecord => {
  if (entry.status === "in_match" && entry.matchId) {
    return run;
  }

  if (entry.status !== "ready") {
    return run;
  }

  if (!entry.playerAUserId || !entry.playerBUserId) {
    return run;
  }

  if (!isHumanParticipant(entry.playerAUserId) && !isHumanParticipant(entry.playerBUserId)) {
    return run;
  }

  const metadata = asRecord(run.metadata) ?? {};
  const modeId = getRunGameMode(run);
  const rewardSettings = resolveTournamentXpRewardSettings(metadata);
  const botPolicy = normalizeTournamentBotPolicy(run.metadata);
  let createdMatchId: string | null = null;
  const launchedAt = new Date().toISOString();

  const nextRun = updateRunWithRetry(nk, logger, run.runId, (current) => {
    if (!current.bracket) {
      return current;
    }

    const currentEntry = getTournamentBracketEntry(current.bracket, entry.entryId);
    if (!currentEntry || currentEntry.matchId || currentEntry.status !== "ready") {
      return current;
    }

    if (!currentEntry.playerAUserId || !currentEntry.playerBUserId) {
      return current;
    }

    const botUserId = getEntryBotOpponent(currentEntry, requestedByUserId);
    const botDisplayName = botUserId
      ? buildTournamentBotDisplayNames([botUserId], botPolicy.difficulty)[botUserId] ?? botUserId
      : null;

    createdMatchId = nk.matchCreate("authoritative_match", {
      playerIds: [currentEntry.playerAUserId, currentEntry.playerBUserId],
      modeId,
      rankedMatch: true,
      casualMatch: false,
      botMatch: Boolean(botUserId),
      privateMatch: false,
      winRewardSource: "pvp_win",
      allowsChallengeRewards: true,
      tournamentRunId: current.runId,
      tournamentId: current.tournamentId,
      tournamentRound: currentEntry.round,
      tournamentEntryId: currentEntry.entryId,
      tournamentMatchWinXp: rewardSettings.xpPerMatchWin,
      tournamentChampionXp: rewardSettings.xpForTournamentChampion,
      tournamentEliminationRisk: true,
      ...(botUserId
        ? {
            botDifficulty: botPolicy.difficulty ?? DEFAULT_BOT_DIFFICULTY,
            botUserId,
            botDisplayName,
          }
        : {}),
    });

    const matchId = createdMatchId;
    if (!matchId) {
      throw new Error("Unable to allocate tournament match.");
    }

    return {
      ...current,
      updatedAt: launchedAt,
      bracket: startTournamentBracketMatch(current.bracket, requestedByUserId, matchId, launchedAt),
    };
  });

  const nextEntry = getTournamentBracketEntry(nextRun.bracket, entry.entryId);
  const resolvedMatchId = nextEntry?.matchId ?? createdMatchId;
  if (resolvedMatchId) {
    logger.info(
      "Tournament dispatch prepared match %s for run %s entry %s.",
      resolvedMatchId,
      nextRun.runId,
      entry.entryId,
    );
  }

  return nextRun;
};

export const ensureReadyTournamentMatchesForRun = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  run: TournamentRunRecord,
): TournamentRunRecord => {
  let currentRun = run;
  const readyEntries = run.bracket?.entries.filter((entry) => entry.status === "ready" && !entry.matchId) ?? [];

  readyEntries.forEach((entry) => {
    const requestedByUserId = getEntryHumanParticipants(entry)[0] ?? null;
    if (!requestedByUserId) {
      return;
    }

    currentRun = ensureTournamentMatchForEntry(nk, logger, currentRun, entry, requestedByUserId);
  });

  return currentRun;
};

const resolveParticipantActiveEntry = (
  run: TournamentRunRecord,
  participant: TournamentBracketParticipant,
): TournamentBracketEntry | null => {
  const currentEntry = participant.currentEntryId
    ? getTournamentBracketEntry(run.bracket, participant.currentEntryId)
    : null;
  const activeEntry = participant.activeMatchId
    ? getTournamentBracketEntryByMatchId(run.bracket, participant.activeMatchId)
    : null;

  return activeEntry ?? currentEntry ?? null;
};

const deriveFlowFromRun = (
  run: TournamentRunRecord,
  userId: string,
  existing: TournamentParticipantFlowRecord | null,
  now: string,
): TournamentParticipantFlowRecord => {
  if (!run.bracket) {
    return createFlowRecord(run, userId, "registered", 1, null, null, existing, now);
  }

  const participant = getTournamentBracketParticipant(run.bracket, userId);
  if (!participant) {
    return createFlowRecord(
      run,
      userId,
      "registered",
      getTournamentBracketCurrentRound(run.bracket),
      null,
      null,
      existing,
      now,
    );
  }

  if (participant.state === "eliminated") {
    return createFlowRecord(
      run,
      userId,
      "eliminated",
      participant.currentRound,
      null,
      null,
      existing,
      now,
    );
  }

  if (
    participant.state === "champion" ||
    participant.state === "runner_up" ||
    run.lifecycle === "closed" ||
    run.lifecycle === "finalized" ||
    run.finalizedAt != null ||
    run.bracket.finalizedAt != null
  ) {
    return createFlowRecord(
      run,
      userId,
      "completed",
      participant.currentRound,
      null,
      null,
      existing,
      now,
    );
  }

  const activeEntry = resolveParticipantActiveEntry(run, participant);
  const activeMatchId = participant.activeMatchId ?? activeEntry?.matchId ?? null;
  const activeRound = activeEntry?.round ?? participant.currentRound ?? getTournamentBracketCurrentRound(run.bracket);

  if (activeMatchId) {
    return createFlowRecord(
      run,
      userId,
      existing?.state === "in_match" ? "in_match" : "pending_match",
      activeRound,
      activeMatchId,
      {
        type: "match",
        matchId: activeMatchId,
        round: activeRound,
      },
      existing,
      now,
    );
  }

  return createFlowRecord(
    run,
    userId,
    "waiting_next_round",
    activeRound,
    null,
    {
      type: "waiting_room",
      round: activeRound,
    },
    existing,
    now,
  );
};

export const syncTournamentParticipantFlow = (
  nk: RuntimeNakama,
  run: TournamentRunRecord,
  userId: string,
): TournamentParticipantFlowRecord =>
  upsertTournamentParticipantFlow(nk, run, userId, (existing, now) =>
    deriveFlowFromRun(run, userId, existing, now),
  );

export const syncTournamentParticipantFlowsForRun = (
  nk: RuntimeNakama,
  run: TournamentRunRecord,
): void => {
  const userIds = Array.from(
    new Set(
      [
        ...run.registrations.map((registration) => registration.userId),
        ...(run.bracket?.participants.map((participant) => participant.userId) ?? []),
      ].filter(isHumanParticipant),
    ),
  );

  userIds.forEach((userId) => {
    syncTournamentParticipantFlow(nk, run, userId);
  });
};

export const ensureTournamentMatchDispatchForParticipant = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  run: TournamentRunRecord,
  userId: string,
): { run: TournamentRunRecord; flow: TournamentParticipantFlowRecord } => {
  let nextRun = ensureReadyTournamentMatchesForRun(nk, logger, run);
  const flow = syncTournamentParticipantFlow(nk, nextRun, userId);
  return {
    run: nextRun,
    flow,
  };
};

export const markTournamentParticipantFlowInMatch = (
  nk: RuntimeNakama,
  run: TournamentRunRecord,
  userId: string,
  matchId: string,
): TournamentParticipantFlowRecord =>
  upsertTournamentParticipantFlow(nk, run, userId, (existing, now) => {
    const currentRound = existing?.currentRound ?? getTournamentBracketCurrentRound(run.bracket);
    return createFlowRecord(
      run,
      userId,
      "in_match",
      currentRound,
      matchId,
      {
        type: "match",
        matchId,
        round: currentRound,
      },
      existing,
      now,
    );
  });

export const buildTournamentParticipantFlowResponse = (
  run: TournamentRunRecord,
  flow: TournamentParticipantFlowRecord,
): TournamentParticipantFlowResponse => ({
  ...flow,
  tournamentName: run.title,
  gameMode: getRunGameMode(run),
});

export const isActiveTournamentParticipantFlow = (flow: TournamentParticipantFlowRecord | null): boolean =>
  Boolean(
    flow &&
      (flow.state === "pending_match" ||
        flow.state === "in_match" ||
        flow.state === "waiting_next_round") &&
      flow.pendingDestination,
  );

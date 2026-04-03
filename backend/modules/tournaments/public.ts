import { appendTournamentAuditEntry } from "./audit";
import {
  MAX_STANDINGS_LIMIT,
  TournamentRunRecord,
  clampInteger,
  getNakamaTournamentById,
  getNakamaTournamentsById,
  maybeAutoFinalizeRunForLobbyTimeout,
  readRunIndexState,
  readRunOrThrow,
  readRunsByIds,
  resolveRunStandingsSnapshot,
  updateRunWithRetry,
} from "./admin";
import {
  createSingleEliminationBracket,
  getTournamentBracketCurrentRound,
  getTournamentBracketEntry,
  getTournamentBracketEntryByMatchId,
  getTournamentBracketParticipant,
  hasTournamentBracketStarted,
  startTournamentBracketMatch,
  upsertTournamentRegistration,
  type TournamentBracketEntry,
  type TournamentBracketParticipant,
  type TournamentBracketParticipantState,
  type TournamentBracketState,
} from "./bracket";
import {
  getActorLabel,
  parseJsonPayload,
  readNumberField,
  resolveTournamentXpRewardSettings,
  readStringField,
  requireAuthenticatedUserId,
} from "./definitions";
import { maybeAutoFinalizeTournamentRunById } from "./matchResults";
import type { RuntimeContext, RuntimeLogger, RuntimeNakama } from "./types";
import { requireCompletedUsernameOnboarding } from "../usernameOnboarding";
import { DEFAULT_BOT_DIFFICULTY } from "../../../logic/bot/types";
import { getTournamentLobbyDeadlineAt } from "../../../shared/tournamentLobby";
import {
  buildTournamentBotDisplayNames,
  buildTournamentBotSummary,
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

const TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION = "tournament_run_memberships";
const DEFAULT_PUBLIC_LIST_LIMIT = 50;
const DEFAULT_PUBLIC_STANDINGS_LIMIT = 256;

export const RPC_LIST_PUBLIC_TOURNAMENTS = "list_public_tournaments";
export const RPC_GET_PUBLIC_TOURNAMENT = "get_public_tournament";
export const RPC_GET_PUBLIC_TOURNAMENT_STANDINGS = "get_public_tournament_standings";
export const RPC_JOIN_PUBLIC_TOURNAMENT = "join_public_tournament";
export const RPC_LAUNCH_TOURNAMENT_MATCH = "launch_tournament_match";

type TournamentRunMembershipRecord = {
  runId: string;
  tournamentId: string;
  userId: string;
  displayName: string;
  joinedAt: string;
  updatedAt: string;
};

type PublicMembershipState = {
  isJoined: boolean;
  joinedAt: string | null;
};

type PublicParticipationState = {
  state: TournamentBracketParticipantState | null;
  currentRound: number | null;
  currentEntryId: string | null;
  activeMatchId: string | null;
  finalPlacement: number | null;
  lastResult: "win" | "loss" | null;
  canLaunch: boolean;
};

type PublicTournamentResponse = {
  runId: string;
  tournamentId: string;
  name: string;
  description: string;
  lifecycle: TournamentRunRecord["lifecycle"];
  startAt: string;
  endAt: string | null;
  updatedAt: string;
  lobbyDeadlineAt: string | null;
  entrants: number;
  maxEntrants: number;
  gameMode: string;
  region: string;
  buyInLabel: string;
  prizeLabel: string;
  xpPerMatchWin: number;
  xpForTournamentChampion: number;
  bots: ReturnType<typeof buildTournamentBotSummary>;
  isLocked: boolean;
  currentRound: number | null;
  membership: PublicMembershipState;
  participation: PublicParticipationState;
};

const normalizeMembershipRecord = (
  value: unknown,
  fallbackRunId: string,
  fallbackUserId: string,
): TournamentRunMembershipRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const runId = readStringField(record, ["runId", "run_id"]) ?? fallbackRunId;
  const tournamentId = readStringField(record, ["tournamentId", "tournament_id"]) ?? runId;
  const userId = readStringField(record, ["userId", "user_id"]) ?? fallbackUserId;
  const displayName = readStringField(record, ["displayName", "display_name"]);
  const joinedAt = readStringField(record, ["joinedAt", "joined_at"]);
  const updatedAt = readStringField(record, ["updatedAt", "updated_at"]) ?? joinedAt;

  if (!runId || !tournamentId || !userId || !displayName || !joinedAt || !updatedAt) {
    return null;
  }

  return {
    runId,
    tournamentId,
    userId,
    displayName,
    joinedAt,
    updatedAt,
  };
};

const toIsoFromUnixSeconds = (seconds: number | null, fallback: string | null): string | null => {
  if (typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0) {
    return new Date(seconds * 1000).toISOString();
  }

  return fallback;
};

const readMetadata = (run: TournamentRunRecord): Record<string, unknown> => asRecord(run.metadata) ?? {};

const getRunBotUserIds = (run: TournamentRunRecord): string[] => {
  const userIds = new Set<string>();

  run.registrations.forEach((registration) => {
    if (isTournamentBotUserId(registration.userId)) {
      userIds.add(registration.userId);
    }
  });

  run.bracket?.participants.forEach((participant) => {
    if (isTournamentBotUserId(participant.userId)) {
      userIds.add(participant.userId);
    }
  });

  run.bracket?.entries.forEach((entry) => {
    if (isTournamentBotUserId(entry.playerAUserId)) {
      userIds.add(entry.playerAUserId);
    }
    if (isTournamentBotUserId(entry.playerBUserId)) {
      userIds.add(entry.playerBUserId);
    }
  });

  return Array.from(userIds);
};

const formatPrizeLabel = (metadata: Record<string, unknown>): string => {
  const explicitPrize = readStringField(metadata, ["prizePool", "prize_pool", "prizeLabel", "prize_label"]);
  if (explicitPrize) {
    return explicitPrize;
  }

  const buyIn = readStringField(metadata, ["buyIn", "buy_in"]) ?? "Free";
  return buyIn === "Free" ? "No prize listed" : `${buyIn} buy-in`;
};

const buildMembershipState = (membership: TournamentRunMembershipRecord | null): PublicMembershipState => ({
  isJoined: Boolean(membership),
  joinedAt: membership?.joinedAt ?? null,
});

const buildFinalizedParticipationOverride = (
  run: TournamentRunRecord,
  participant: {
    userId: string;
    currentRound: number | null;
    currentEntryId: string | null;
  },
): PublicParticipationState | null => {
  if (!run.bracket?.finalizedAt) {
    return null;
  }

  if (run.bracket.winnerUserId === participant.userId) {
    return {
      state: "champion",
      currentRound: participant.currentRound,
      currentEntryId: participant.currentEntryId,
      activeMatchId: null,
      finalPlacement: 1,
      lastResult: "win",
      canLaunch: false,
    };
  }

  if (run.bracket.runnerUpUserId === participant.userId) {
    return {
      state: "runner_up",
      currentRound: participant.currentRound,
      currentEntryId: participant.currentEntryId,
      activeMatchId: null,
      finalPlacement: 2,
      lastResult: "loss",
      canLaunch: false,
    };
  }

  return null;
};

const readStandingsRecordRank = (record: Record<string, unknown> | null): number | null => {
  const rank = readNumberField(record, ["rank"]);
  return typeof rank === "number" && Number.isFinite(rank) ? Math.max(1, Math.floor(rank)) : null;
};

const readStandingsRecordOwnerId = (record: Record<string, unknown> | null): string | null =>
  readStringField(record, ["ownerId", "owner_id"]);

const readStandingsRecordMetadata = (record: Record<string, unknown> | null): Record<string, unknown> =>
  asRecord(record?.metadata) ?? {};

const normalizeSnapshotResult = (value: string | null): "win" | "loss" | null =>
  value === "win" || value === "loss" ? value : null;

const buildStoredFinalizedParticipationOverride = (
  run: TournamentRunRecord,
  userId: string,
  participant: {
    currentRound: number | null;
    currentEntryId: string | null;
    finalPlacement: number | null;
    lastResult: "win" | "loss" | null;
  } | null,
): PublicParticipationState | null => {
  const terminalLifecycle =
    run.lifecycle === "closed" || run.lifecycle === "finalized" || run.finalizedAt != null;
  const snapshotRecord =
    run.finalSnapshot?.records
      .map((entry) => asRecord(entry))
      .find((entry) => readStandingsRecordOwnerId(entry) === userId) ?? null;

  if (!terminalLifecycle && !snapshotRecord) {
    return null;
  }

  const finalPlacement = readStandingsRecordRank(snapshotRecord) ?? participant?.finalPlacement ?? null;
  const metadata = readStandingsRecordMetadata(snapshotRecord);
  const snapshotState = readStringField(metadata, ["state"]);
  const state =
    snapshotState === "champion" || snapshotState === "runner_up" || snapshotState === "eliminated"
      ? snapshotState
      : finalPlacement === 1
        ? "champion"
        : finalPlacement === 2
          ? "runner_up"
          : typeof finalPlacement === "number"
            ? "eliminated"
            : null;

  if (!state) {
    return null;
  }

  const snapshotLastResult = normalizeSnapshotResult(readStringField(metadata, ["result"]));

  return {
    state,
    currentRound: participant?.currentRound ?? readNumberField(metadata, ["round"]),
    currentEntryId:
      participant?.currentEntryId ??
      readStringField(metadata, ["entryId", "entry_id"]),
    activeMatchId: null,
    finalPlacement,
    lastResult:
      snapshotLastResult ??
      participant?.lastResult ??
      (state === "champion" ? "win" : state === "runner_up" ? "loss" : null),
    canLaunch: false,
  };
};

const isParticipantAssignedToEntry = (
  entry: TournamentBracketEntry | null,
  userId: string,
): entry is TournamentBracketEntry =>
  Boolean(entry && (entry.playerAUserId === userId || entry.playerBUserId === userId));

const resolvePublicParticipantBracketState = (
  bracket: TournamentBracketState,
  participant: TournamentBracketParticipant,
): {
  currentEntry: TournamentBracketEntry | null;
  activeMatchId: string | null;
  playerState: TournamentBracketParticipantState;
  canLaunch: boolean;
} => {
  const currentEntryCandidate = participant.currentEntryId
    ? getTournamentBracketEntry(bracket, participant.currentEntryId)
    : null;
  const currentEntry = isParticipantAssignedToEntry(currentEntryCandidate, participant.userId)
    ? currentEntryCandidate
    : null;
  const activeEntryCandidate = participant.activeMatchId
    ? getTournamentBracketEntryByMatchId(bracket, participant.activeMatchId)
    : null;
  const activeEntry = isParticipantAssignedToEntry(activeEntryCandidate, participant.userId)
    ? activeEntryCandidate
    : null;
  const resumedEntry =
    currentEntry?.status === "in_match" && currentEntry.matchId
      ? currentEntry
      : !currentEntry && activeEntry?.status === "in_match" && activeEntry.matchId
        ? activeEntry
        : null;
  const resolvedEntry = currentEntry ?? resumedEntry ?? null;
  const activeMatchId = resumedEntry?.matchId ?? null;
  const canLaunch = Boolean(
    activeMatchId ||
      (currentEntry && (currentEntry.status === "ready" || currentEntry.status === "in_match")),
  );

  let playerState = participant.state;
  if (activeMatchId) {
    playerState = "in_match";
  } else if (participant.state === "in_match" && currentEntry && currentEntry.status !== "completed") {
    playerState = "waiting_next_round";
  }

  return {
    currentEntry: resolvedEntry,
    activeMatchId,
    playerState,
    canLaunch,
  };
};

const resolveMembershipForRun = (
  run: TournamentRunRecord,
  membership: TournamentRunMembershipRecord | null,
): TournamentRunMembershipRecord | null => {
  if (!membership) {
    return null;
  }

  if (membership.runId !== run.runId || membership.tournamentId !== run.tournamentId) {
    return null;
  }

  const joinedAtMs = Date.parse(membership.joinedAt);
  const runCreatedAtMs = Date.parse(run.createdAt);
  if (
    Number.isFinite(joinedAtMs) &&
    Number.isFinite(runCreatedAtMs) &&
    joinedAtMs < runCreatedAtMs
  ) {
    return null;
  }

  return membership;
};

const getRunEndTimeMs = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
): number | null => {
  const endTimeSeconds = readNumberField(nakamaTournament, ["endTime", "end_time"]) ?? run.endTime;
  if (typeof endTimeSeconds !== "number" || !Number.isFinite(endTimeSeconds) || endTimeSeconds <= 0) {
    return null;
  }

  return Math.floor(endTimeSeconds * 1000);
};

const getRunStartTimeMs = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
): number | null => {
  const startTimeSeconds = readNumberField(nakamaTournament, ["startTime", "start_time"]) ?? run.startTime;
  if (typeof startTimeSeconds !== "number" || !Number.isFinite(startTimeSeconds) || startTimeSeconds <= 0) {
    return null;
  }

  return Math.floor(startTimeSeconds * 1000);
};

const getRunEntrants = (run: TournamentRunRecord, nakamaTournament: Record<string, unknown> | null): number =>
  Math.max(
    run.registrations.length,
    Math.max(0, Math.floor(readNumberField(nakamaTournament, ["size"]) ?? 0)),
  );

const getRunMaxEntrants = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
): number =>
  Math.max(
    0,
    Math.floor(readNumberField(nakamaTournament, ["maxSize", "max_size"]) ?? run.maxSize),
  );

const isPublicRunFull = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
): boolean => {
  const maxEntrants = getRunMaxEntrants(run, nakamaTournament);
  return maxEntrants > 0 && getRunEntrants(run, nakamaTournament) >= maxEntrants;
};

const getLaunchBlockedReason = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
): "lobby" | null => {
  if (!isPublicRunFull(run, nakamaTournament)) {
    return "lobby";
  }

  return null;
};

const isPublicRunActive = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
  nowMs = Date.now(),
): boolean => {
  if (
    run.lifecycle !== "open" ||
    run.finalizedAt != null ||
    run.bracket?.finalizedAt != null ||
    !nakamaTournament
  ) {
    return false;
  }

  const endTimeMs = getRunEndTimeMs(run, nakamaTournament);
  return endTimeMs === null || endTimeMs > nowMs;
};

const comparePublicTournamentOrder = (left: PublicTournamentResponse, right: PublicTournamentResponse): number => {
  const nowMs = Date.now();
  const leftStartMs = Date.parse(left.startAt);
  const rightStartMs = Date.parse(right.startAt);
  const leftStarted = Number.isFinite(leftStartMs) && leftStartMs <= nowMs;
  const rightStarted = Number.isFinite(rightStartMs) && rightStartMs <= nowMs;

  if (leftStarted !== rightStarted) {
    return leftStarted ? -1 : 1;
  }

  if (leftStarted && rightStarted) {
    if (leftStartMs !== rightStartMs) {
      return rightStartMs - leftStartMs;
    }
  } else if (leftStartMs !== rightStartMs) {
    return leftStartMs - rightStartMs;
  }

  const updatedCompare = right.updatedAt.localeCompare(left.updatedAt);
  if (updatedCompare !== 0) {
    return updatedCompare;
  }

  return left.runId.localeCompare(right.runId);
};

const assertPublicRunVisible = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
  nowMs = Date.now(),
): void => {
  if (!isPublicRunActive(run, nakamaTournament, nowMs)) {
    throw new Error("This tournament is not available in public play.");
  }
};

const assertPublicRunReadable = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
  membership: TournamentRunMembershipRecord | null,
  nowMs = Date.now(),
): void => {
  if (isPublicRunActive(run, nakamaTournament, nowMs)) {
    return;
  }

  if (
    membership &&
    (
      run.lifecycle === "closed" ||
      run.lifecycle === "finalized" ||
      run.finalizedAt != null ||
      run.bracket?.finalizedAt != null
    )
  ) {
    return;
  }

  throw new Error("This tournament is not available in public play.");
};

const readMembershipObject = (nk: RuntimeNakama, runId: string, userId: string): RuntimeStorageObject | null => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION,
      key: runId,
      userId,
    },
  ]) as RuntimeStorageObject[];

  return findStorageObject(objects, TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION, runId, userId);
};

const readMembership = (nk: RuntimeNakama, runId: string, userId: string): TournamentRunMembershipRecord | null =>
  normalizeMembershipRecord(readMembershipObject(nk, runId, userId)?.value ?? null, runId, userId);

const readMembershipsByRunId = (
  nk: RuntimeNakama,
  runIds: string[],
  userId: string,
): Record<string, TournamentRunMembershipRecord | null> => {
  const filteredRunIds = Array.from(new Set(runIds.filter((runId) => runId.trim().length > 0)));
  if (filteredRunIds.length === 0) {
    return {};
  }

  const objects = nk.storageRead(
    filteredRunIds.map((runId) => ({
      collection: TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION,
      key: runId,
      userId,
    })),
  ) as RuntimeStorageObject[];

  return filteredRunIds.reduce(
    (accumulator, runId) => {
      const object = findStorageObject(objects, TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION, runId, userId);
      accumulator[runId] = normalizeMembershipRecord(object?.value ?? null, runId, userId);
      return accumulator;
    },
    {} as Record<string, TournamentRunMembershipRecord | null>,
  );
};

const writeMembership = (
  nk: RuntimeNakama,
  run: TournamentRunRecord,
  userId: string,
  displayName: string,
): TournamentRunMembershipRecord => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const existingObject = readMembershipObject(nk, run.runId, userId);
    const existing = resolveMembershipForRun(
      run,
      normalizeMembershipRecord(existingObject?.value ?? null, run.runId, userId),
    );
    const now = new Date().toISOString();
    const joinedAt = existing?.joinedAt ?? now;
    const record: TournamentRunMembershipRecord = {
      runId: run.runId,
      tournamentId: run.tournamentId,
      userId,
      displayName,
      joinedAt,
      updatedAt: now,
    };

    try {
      nk.storageWrite([
        maybeSetStorageVersion({
          collection: TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION,
          key: run.runId,
          userId,
          value: record,
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE,
        }, getStorageObjectVersion(existingObject)),
      ]);

      return record;
    } catch (error) {
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
    }
  }

  throw new Error(`Unable to store membership for tournament '${run.runId}'.`);
};

const buildPublicParticipationState = (
  run: TournamentRunRecord,
  membership: TournamentRunMembershipRecord | null,
): PublicParticipationState => {
  if (!membership) {
    return {
      state: null,
      currentRound: null,
      currentEntryId: null,
      activeMatchId: null,
      finalPlacement: null,
      lastResult: null,
      canLaunch: false,
    };
  }

  if (!run.bracket) {
    const storedFinalizedParticipation = buildStoredFinalizedParticipationOverride(run, membership.userId, null);
    if (storedFinalizedParticipation) {
      return storedFinalizedParticipation;
    }

    return {
      state: "lobby",
      currentRound: 1,
      currentEntryId: null,
      activeMatchId: null,
      finalPlacement: null,
      lastResult: null,
      canLaunch: false,
    };
  }

  const participant = getTournamentBracketParticipant(run.bracket, membership.userId);
  if (!participant) {
    const storedFinalizedParticipation = buildStoredFinalizedParticipationOverride(run, membership.userId, null);
    if (storedFinalizedParticipation) {
      return storedFinalizedParticipation;
    }

    return {
      state: null,
      currentRound: getTournamentBracketCurrentRound(run.bracket),
      currentEntryId: null,
      activeMatchId: null,
      finalPlacement: null,
      lastResult: null,
      canLaunch: false,
    };
  }

  const finalizedParticipation = buildFinalizedParticipationOverride(run, participant);
  if (finalizedParticipation) {
    return finalizedParticipation;
  }

  const storedFinalizedParticipation = buildStoredFinalizedParticipationOverride(run, membership.userId, participant);
  if (storedFinalizedParticipation) {
    return storedFinalizedParticipation;
  }

  const resolvedParticipantState = resolvePublicParticipantBracketState(run.bracket, participant);

  return {
    state: resolvedParticipantState.playerState,
    currentRound: resolvedParticipantState.currentEntry?.round ?? participant.currentRound,
    currentEntryId: resolvedParticipantState.currentEntry?.entryId ?? participant.currentEntryId,
    activeMatchId: resolvedParticipantState.activeMatchId,
    finalPlacement: participant.finalPlacement,
    lastResult: participant.lastResult,
    canLaunch: resolvedParticipantState.canLaunch,
  };
};

const buildPublicTournamentResponse = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
  membership: TournamentRunMembershipRecord | null,
): PublicTournamentResponse => {
  const metadata = readMetadata(run);
  const createdAt = run.createdAt;
  const resolvedMembership = resolveMembershipForRun(run, membership);
  const participation = buildPublicParticipationState(run, resolvedMembership);
  const rewardSettings = resolveTournamentXpRewardSettings(metadata);

  return {
    runId: run.runId,
    tournamentId: run.tournamentId,
    name: run.title,
    description: run.description || "No description configured.",
    lifecycle: run.lifecycle,
    startAt:
      toIsoFromUnixSeconds(
        readNumberField(nakamaTournament, ["startTime", "start_time"]) ?? run.startTime,
        createdAt,
      ) ?? createdAt,
    endAt: toIsoFromUnixSeconds(
      readNumberField(nakamaTournament, ["endTime", "end_time"]) ?? run.endTime,
      null,
    ),
    updatedAt: run.updatedAt,
    lobbyDeadlineAt: getTournamentLobbyDeadlineAt(run.openedAt),
    entrants: getRunEntrants(run, nakamaTournament),
    maxEntrants: getRunMaxEntrants(run, nakamaTournament),
    gameMode: readStringField(metadata, ["gameMode", "game_mode"]) ?? "standard",
    region: readStringField(metadata, ["region"]) ?? "Global",
    buyInLabel: readStringField(metadata, ["buyIn", "buy_in"]) ?? "Free",
    prizeLabel: formatPrizeLabel(metadata),
    xpPerMatchWin: rewardSettings.xpPerMatchWin,
    xpForTournamentChampion: rewardSettings.xpForTournamentChampion,
    bots: buildTournamentBotSummary(run.metadata, getRunBotUserIds(run)),
    isLocked: hasTournamentBracketStarted(run.bracket),
    currentRound: participation.currentRound ?? getTournamentBracketCurrentRound(run.bracket),
    membership: buildMembershipState(resolvedMembership),
    participation,
  };
};

const listPublicRuns = (nk: RuntimeNakama): TournamentRunRecord[] => {
  const indexState = readRunIndexState(nk);
  return readRunsByIds(nk, indexState.index.runIds);
};

const ensureRunRegistration = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  run: TournamentRunRecord,
  membership: TournamentRunMembershipRecord,
): TournamentRunRecord => updateRunWithRetry(nk, logger, run.runId, (current) => {
  const existing = current.registrations.find((entry) => entry.userId === membership.userId) ?? null;

  if (existing && existing.displayName === membership.displayName) {
    return current;
  }

  const result = upsertTournamentRegistration(
    current.registrations,
    membership.userId,
    membership.displayName,
    membership.joinedAt,
  );

  return {
    ...current,
    updatedAt: new Date().toISOString(),
    registrations: result.registrations,
  };
});

const maybeStartBracketForRun = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  run: TournamentRunRecord,
): TournamentRunRecord => {
  if (run.bracket || run.lifecycle !== "open") {
    return run;
  }

  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  if (!isPublicRunFull(run, nakamaTournament)) {
    return run;
  }

  return updateRunWithRetry(nk, logger, run.runId, (current) => {
    if (current.bracket) {
      return current;
    }

    const startedAt = new Date().toISOString();
    return {
      ...current,
      updatedAt: startedAt,
      bracket: createSingleEliminationBracket(current.registrations, startedAt),
    };
  });
};

const buildTournamentLaunchResponse = (params: {
  run: TournamentRunRecord;
  matchId: string | null;
  tournamentRound: number | null;
  tournamentEntryId: string | null;
  playerState: string;
  nextRoundReady: boolean;
  statusMessage: string;
  queueStatus: string;
}): string =>
  JSON.stringify({
    ok: true,
    matchId: params.matchId,
    matchToken: null,
    tournamentRunId: params.run.runId,
    tournamentId: params.run.tournamentId,
    tournamentRound: params.tournamentRound,
    tournamentEntryId: params.tournamentEntryId,
    playerState: params.playerState,
    nextRoundReady: params.nextRoundReady,
    queueStatus: params.queueStatus,
    statusMessage: params.statusMessage,
  });

const maybeFinalizePublicRun = (
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  run: TournamentRunRecord,
): TournamentRunRecord => {
  const maybeTimedOutRun = maybeAutoFinalizeRunForLobbyTimeout(logger, nk, run);
  if (maybeTimedOutRun.lifecycle === "finalized") {
    return maybeTimedOutRun;
  }

  try {
    return maybeAutoFinalizeTournamentRunById(nk, logger, maybeTimedOutRun.runId)?.run ?? maybeTimedOutRun;
  } catch (error) {
    logger.warn(
      "Unable to auto-finalize public tournament run %s while serving player status: %s",
      maybeTimedOutRun.runId,
      String(error),
    );
    return readRunOrThrow(nk, maybeTimedOutRun.runId);
  }
};

export const rpcListPublicTournaments = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  const userId = requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload(payload);
  const limit = clampInteger(parsed.limit, DEFAULT_PUBLIC_LIST_LIMIT, 1, 100);
  const runs = listPublicRuns(nk).map((run) =>
    maybeFinalizePublicRun(
      logger,
      nk,
      maybeStartBracketForRun(nk, logger, run),
    ),
  );
  const tournamentsById = getNakamaTournamentsById(
    nk,
    runs.map((run) => run.tournamentId),
  );
  const membershipsByRunId = readMembershipsByRunId(
    nk,
    runs.map((run) => run.runId),
    userId,
  );
  const nowMs = Date.now();
  const visibleRuns = runs.filter((run) =>
    isPublicRunActive(run, tournamentsById[run.tournamentId] ?? null, nowMs),
  );
  const tournaments = visibleRuns
    .map((run) =>
      buildPublicTournamentResponse(
        run,
        tournamentsById[run.tournamentId] ?? null,
        membershipsByRunId[run.runId] ?? null,
      ),
    )
    .sort(comparePublicTournamentOrder)
    .slice(0, limit);

  return JSON.stringify({
    ok: true,
    tournaments,
    totalCount: visibleRuns.length,
  });
};

export const rpcGetPublicTournament = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  const userId = requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload(payload);
  const runId = readStringField(parsed, [
    "runId",
    "run_id",
    "tournamentRunId",
    "tournament_run_id",
    "tournamentId",
    "tournament_id",
  ]);

  if (!runId) {
    throw new Error("runId is required.");
  }

  let run = readRunOrThrow(nk, runId);
  run = maybeStartBracketForRun(nk, logger, run);
  run = maybeFinalizePublicRun(logger, nk, run);
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  const membership = resolveMembershipForRun(run, readMembership(nk, run.runId, userId));
  assertPublicRunReadable(run, nakamaTournament, membership);

  return JSON.stringify({
    ok: true,
    tournament: buildPublicTournamentResponse(
      run,
      nakamaTournament,
      membership,
    ),
  });
};

export const rpcGetPublicTournamentStandings = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  const userId = requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload(payload);
  const runId = readStringField(parsed, [
    "runId",
    "run_id",
    "tournamentRunId",
    "tournament_run_id",
    "tournamentId",
    "tournament_id",
  ]);

  if (!runId) {
    throw new Error("runId is required.");
  }

  let run = readRunOrThrow(nk, runId);
  run = maybeStartBracketForRun(nk, logger, run);
  run = maybeFinalizePublicRun(logger, nk, run);
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  const membership = resolveMembershipForRun(run, readMembership(nk, run.runId, userId));
  assertPublicRunReadable(run, nakamaTournament, membership);
  const limit = clampInteger(
    parsed.limit ?? run.maxSize,
    Math.max(DEFAULT_PUBLIC_STANDINGS_LIMIT, run.maxSize),
    1,
    MAX_STANDINGS_LIMIT,
  );
  const standings = resolveRunStandingsSnapshot(nk, run, limit, 0);

  return JSON.stringify({
    ok: true,
    tournamentRunId: run.runId,
    tournamentId: run.tournamentId,
    standings,
  });
};

export const rpcJoinPublicTournament = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  const userId = requireAuthenticatedUserId(ctx);
  requireCompletedUsernameOnboarding(nk, userId);
  const parsed = parseJsonPayload(payload);
  const runId = readStringField(parsed, [
    "runId",
    "run_id",
    "tournamentRunId",
    "tournament_run_id",
    "tournamentId",
    "tournament_id",
  ]);

  if (!runId) {
    throw new Error("runId is required.");
  }

  let run = readRunOrThrow(nk, runId);
  run = maybeStartBracketForRun(nk, logger, run);
  run = maybeFinalizePublicRun(logger, nk, run);
  const nakamaTournamentBeforeJoin = getNakamaTournamentById(nk, run.tournamentId);
  assertPublicRunVisible(run, nakamaTournamentBeforeJoin);

  const existingMembership = resolveMembershipForRun(run, readMembership(nk, run.runId, userId));
  const displayName = getActorLabel(ctx);
  let joined = false;
  let membership = existingMembership;

  if (run.bracket) {
    if (!existingMembership) {
      throw new Error("This tournament is locked because play has already started.");
    }
  } else if (!existingMembership) {
    const entrantsBeforeJoin = getRunEntrants(run, nakamaTournamentBeforeJoin);
    const maxEntrants = getRunMaxEntrants(run, nakamaTournamentBeforeJoin);

    if (maxEntrants > 0 && entrantsBeforeJoin >= maxEntrants) {
      throw new Error("This tournament is already full.");
    }

    nk.tournamentJoin(run.tournamentId, userId, displayName);
    membership = writeMembership(nk, run, userId, displayName);
    joined = true;

    appendTournamentAuditEntry(ctx, logger, nk, { id: run.runId, name: run.title }, "tournament.public_joined", {
      joinedUserId: userId,
      displayName,
    });
  }

  if (!membership) {
    throw new Error("Unable to resolve tournament membership.");
  }

  run = ensureRunRegistration(nk, logger, run, membership);
  run = maybeStartBracketForRun(nk, logger, run);
  run = maybeFinalizePublicRun(logger, nk, run);

  return JSON.stringify({
    ok: true,
    joined,
    tournament: buildPublicTournamentResponse(
      run,
      getNakamaTournamentById(nk, run.tournamentId),
      resolveMembershipForRun(run, readMembership(nk, run.runId, userId)),
    ),
  });
};

export const rpcLaunchTournamentMatch = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  const userId = requireAuthenticatedUserId(ctx);
  requireCompletedUsernameOnboarding(nk, userId);
  const parsed = parseJsonPayload(payload);
  const runId = readStringField(parsed, [
    "runId",
    "run_id",
    "tournamentRunId",
    "tournament_run_id",
    "tournamentId",
    "tournament_id",
  ]);

  if (!runId) {
    throw new Error("runId is required.");
  }

  let run = readRunOrThrow(nk, runId);
  const membership = resolveMembershipForRun(run, readMembership(nk, run.runId, userId));
  if (!membership) {
    throw new Error("Join this tournament before launching a match.");
  }

  run = ensureRunRegistration(nk, logger, run, membership);
  run = maybeStartBracketForRun(nk, logger, run);
  run = maybeFinalizePublicRun(logger, nk, run);

  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  const participation = buildPublicParticipationState(run, membership);
  const isTerminalRun =
    run.lifecycle === "closed" ||
    run.lifecycle === "finalized" ||
    run.finalizedAt != null ||
    run.bracket?.finalizedAt != null;

  if (participation.state === "eliminated") {
    throw new Error("Your tournament run has ended.");
  }

  if (participation.state === "champion" || participation.state === "runner_up" || isTerminalRun) {
    return buildTournamentLaunchResponse({
      run,
      matchId: null,
      tournamentRound: participation.currentRound,
      tournamentEntryId: participation.currentEntryId,
      playerState: participation.state ?? "finalized",
      nextRoundReady: false,
      queueStatus: "finalized",
      statusMessage: "Tournament complete.",
    });
  }

  assertPublicRunVisible(run, nakamaTournament);

  if (!run.bracket) {
    const launchBlockedReason = getLaunchBlockedReason(run, nakamaTournament);
    if (launchBlockedReason === "lobby") {
      throw new Error("This tournament is waiting for the lobby to fill.");
    }

    throw new Error("This tournament bracket is not ready yet.");
  }

  const participant = getTournamentBracketParticipant(run.bracket, userId);
  if (!participant) {
    throw new Error("You are not seated in this tournament bracket.");
  }
  const resolvedParticipantState = resolvePublicParticipantBracketState(run.bracket, participant);

  if (participant.state === "eliminated") {
    throw new Error("Your tournament run has ended.");
  }

  if (participant.state === "champion" || participant.state === "runner_up") {
    return buildTournamentLaunchResponse({
      run,
      matchId: null,
      tournamentRound: participant.currentRound,
      tournamentEntryId: participant.currentEntryId,
      playerState: participant.state,
      nextRoundReady: false,
      queueStatus: "finalized",
      statusMessage: "Tournament complete.",
    });
  }

  if (resolvedParticipantState.activeMatchId) {
    return buildTournamentLaunchResponse({
      run,
      matchId: resolvedParticipantState.activeMatchId,
      tournamentRound: resolvedParticipantState.currentEntry?.round ?? participant.currentRound,
      tournamentEntryId: resolvedParticipantState.currentEntry?.entryId ?? participant.currentEntryId,
      playerState: resolvedParticipantState.playerState,
      nextRoundReady: true,
      queueStatus: "active_match",
      statusMessage: "Resuming active tournament match.",
    });
  }

  if (!resolvedParticipantState.currentEntry) {
    return buildTournamentLaunchResponse({
      run,
      matchId: null,
      tournamentRound: participant.currentRound,
      tournamentEntryId: null,
      playerState: resolvedParticipantState.playerState,
      nextRoundReady: false,
      queueStatus: "waiting_next_round",
      statusMessage: "Waiting for the next tournament pairing.",
    });
  }

  const entry = resolvedParticipantState.currentEntry;

  if (entry.status === "in_match" && entry.matchId) {
    return buildTournamentLaunchResponse({
      run,
      matchId: entry.matchId,
      tournamentRound: entry.round,
      tournamentEntryId: entry.entryId,
      playerState: "in_match",
      nextRoundReady: true,
      queueStatus: "active_match",
      statusMessage: "Resuming active tournament match.",
    });
  }

  if (!resolvedParticipantState.canLaunch || entry.status !== "ready") {
    return buildTournamentLaunchResponse({
      run,
      matchId: null,
      tournamentRound: entry.round,
      tournamentEntryId: entry.entryId,
      playerState: resolvedParticipantState.playerState,
      nextRoundReady: false,
      queueStatus: "waiting_next_round",
      statusMessage: "Waiting for the rest of the bracket to settle.",
    });
  }

  const metadata = readMetadata(run);
  const modeId = readStringField(metadata, ["gameMode", "game_mode"]) ?? "standard";
  const rewardSettings = resolveTournamentXpRewardSettings(metadata);
  const botPolicy = normalizeTournamentBotPolicy(run.metadata);
  const botUserId =
    isTournamentBotUserId(entry.playerAUserId) && entry.playerAUserId !== userId
      ? entry.playerAUserId
      : isTournamentBotUserId(entry.playerBUserId) && entry.playerBUserId !== userId
        ? entry.playerBUserId
        : null;
  const botDisplayName =
    botUserId
      ? buildTournamentBotDisplayNames([botUserId], botPolicy.difficulty)[botUserId] ?? botUserId
      : null;
  const matchId = nk.matchCreate("authoritative_match", {
    playerIds: [entry.playerAUserId, entry.playerBUserId].filter((candidate): candidate is string => Boolean(candidate)),
    modeId,
    rankedMatch: true,
    casualMatch: false,
    botMatch: Boolean(botUserId),
    privateMatch: false,
    winRewardSource: "pvp_win",
    allowsChallengeRewards: true,
    tournamentRunId: run.runId,
    tournamentId: run.tournamentId,
    tournamentRound: entry.round,
    tournamentEntryId: entry.entryId,
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
  const launchedAt = new Date().toISOString();

  run = updateRunWithRetry(nk, logger, run.runId, (current) => {
    if (!current.bracket) {
      return current;
    }

    const currentEntry = getTournamentBracketEntry(current.bracket, entry.entryId);
    if (!currentEntry || currentEntry.matchId) {
      return current;
    }

    return {
      ...current,
      updatedAt: launchedAt,
      bracket: startTournamentBracketMatch(current.bracket, userId, matchId, launchedAt),
    };
  });

  const activeParticipant = run.bracket ? getTournamentBracketParticipant(run.bracket, userId) : null;
  const activeEntry = activeParticipant?.currentEntryId && run.bracket
    ? getTournamentBracketEntry(run.bracket, activeParticipant.currentEntryId)
    : null;
  const resolvedMatchId = activeParticipant?.activeMatchId ?? activeEntry?.matchId ?? matchId;

  appendTournamentAuditEntry(ctx, logger, nk, { id: run.runId, name: run.title }, "tournament.match_launch.created", {
    matchId: resolvedMatchId,
    entryId: entry.entryId,
    round: entry.round,
    playerUserId: userId,
  });

  return buildTournamentLaunchResponse({
    run,
    matchId: resolvedMatchId,
    tournamentRound: activeEntry?.round ?? entry.round,
    tournamentEntryId: activeEntry?.entryId ?? entry.entryId,
    playerState: "in_match",
    nextRoundReady: true,
    queueStatus: "active_match",
    statusMessage: "Tournament match ready.",
  });
};

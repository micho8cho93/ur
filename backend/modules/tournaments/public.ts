import { appendTournamentAuditEntry } from "./audit";
import {
  MAX_STANDINGS_LIMIT,
  RUNS_COLLECTION,
  TournamentRunRecord,
  buildStandingsSnapshot,
  clampInteger,
  getNakamaTournamentById,
  getNakamaTournamentsById,
  readRunIndexState,
  readRunOrThrow,
  readRunsByIds,
} from "./admin";
import {
  getActorLabel,
  parseJsonPayload,
  readNumberField,
  resolveTournamentXpRewardSettings,
  readStringField,
  requireAuthenticatedUserId,
} from "./definitions";
import type { RuntimeContext, RuntimeLogger, RuntimeNakama } from "./types";
import { requireCompletedUsernameOnboarding } from "../usernameOnboarding";
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

const TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION = "tournament_run_memberships";
const TOURNAMENT_MATCH_QUEUE_COLLECTION = "tournament_match_queue";
const DEFAULT_PUBLIC_LIST_LIMIT = 50;
const DEFAULT_PUBLIC_STANDINGS_LIMIT = 256;
const TOURNAMENT_QUEUE_TTL_SECONDS = 300;
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

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

type TournamentMatchQueueRecord = {
  runId: string;
  tournamentId: string;
  matchId: string;
  hostUserId: string;
  modeId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  claimedByUserId: string | null;
  claimedAt: string | null;
};

type PublicMembershipState = {
  isJoined: boolean;
  joinedAt: string | null;
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
  entrants: number;
  maxEntrants: number;
  gameMode: string;
  region: string;
  buyInLabel: string;
  prizeLabel: string;
  membership: PublicMembershipState;
};

const normalizeMembershipRecord = (value: unknown, fallbackRunId: string, fallbackUserId: string): TournamentRunMembershipRecord | null => {
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

const normalizeMatchQueueRecord = (value: unknown, fallbackRunId: string): TournamentMatchQueueRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const runId = readStringField(record, ["runId", "run_id"]) ?? fallbackRunId;
  const tournamentId = readStringField(record, ["tournamentId", "tournament_id"]) ?? runId;
  const matchId = readStringField(record, ["matchId", "match_id"]);
  const hostUserId = readStringField(record, ["hostUserId", "host_user_id"]);
  const modeId = readStringField(record, ["modeId", "mode_id"]) ?? "standard";
  const createdAt = readStringField(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField(record, ["updatedAt", "updated_at"]) ?? createdAt;
  const expiresAt = readStringField(record, ["expiresAt", "expires_at"]);

  if (!runId || !tournamentId || !matchId || !hostUserId || !createdAt || !updatedAt || !expiresAt) {
    return null;
  }

  return {
    runId,
    tournamentId,
    matchId,
    hostUserId,
    modeId,
    createdAt,
    updatedAt,
    expiresAt,
    claimedByUserId: readStringField(record, ["claimedByUserId", "claimed_by_user_id"]),
    claimedAt: readStringField(record, ["claimedAt", "claimed_at"]),
  };
};

const toIsoFromUnixSeconds = (seconds: number | null, fallback: string | null): string | null => {
  if (typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0) {
    return new Date(seconds * 1000).toISOString();
  }

  return fallback;
};

const readMetadata = (run: TournamentRunRecord): Record<string, unknown> => asRecord(run.metadata) ?? {};

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

const buildPublicTournamentResponse = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
  membership: TournamentRunMembershipRecord | null,
): PublicTournamentResponse => {
  const metadata = readMetadata(run);
  const createdAt = run.createdAt;

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
    entrants: Math.max(0, Math.floor(readNumberField(nakamaTournament, ["size"]) ?? 0)),
    maxEntrants: Math.max(
      0,
      Math.floor(readNumberField(nakamaTournament, ["maxSize", "max_size"]) ?? run.maxSize),
    ),
    gameMode: readStringField(metadata, ["gameMode", "game_mode"]) ?? "standard",
    region: readStringField(metadata, ["region"]) ?? "Global",
    buyInLabel: readStringField(metadata, ["buyIn", "buy_in"]) ?? "Free",
    prizeLabel: formatPrizeLabel(metadata),
    membership: buildMembershipState(membership),
  };
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

const isPublicRunActive = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
  nowMs = Date.now(),
): boolean => {
  if (run.lifecycle !== "open" || !nakamaTournament) {
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
    const existing = normalizeMembershipRecord(existingObject?.value ?? null, run.runId, userId);
    const joinedAt = existing?.joinedAt ?? new Date().toISOString();
    const record: TournamentRunMembershipRecord = {
      runId: run.runId,
      tournamentId: run.tournamentId,
      userId,
      displayName,
      joinedAt,
      updatedAt: new Date().toISOString(),
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

const readQueueState = (
  nk: RuntimeNakama,
  runId: string,
): { object: RuntimeStorageObject | null; queue: TournamentMatchQueueRecord | null } => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_MATCH_QUEUE_COLLECTION,
      key: runId,
      userId: SYSTEM_USER_ID,
    },
  ]) as RuntimeStorageObject[];

  const object = findStorageObject(objects, TOURNAMENT_MATCH_QUEUE_COLLECTION, runId, SYSTEM_USER_ID);
  return {
    object,
    queue: normalizeMatchQueueRecord(object?.value ?? null, runId),
  };
};

const isQueueExpired = (queue: TournamentMatchQueueRecord | null, nowMs = Date.now()): boolean => {
  if (!queue) {
    return true;
  }

  const expiresAtMs = Date.parse(queue.expiresAt);
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs;
};

const listPublicRuns = (nk: RuntimeNakama): TournamentRunRecord[] => {
  const indexState = readRunIndexState(nk);
  return readRunsByIds(nk, indexState.index.runIds);
};

export const rpcListPublicTournaments = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  const userId = requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload(payload);
  const limit = clampInteger(parsed.limit, DEFAULT_PUBLIC_LIST_LIMIT, 1, 100);
  const runs = listPublicRuns(nk);
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
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  const userId = requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload(payload);
  const runId = readStringField(parsed, ["runId", "run_id", "tournamentRunId", "tournament_run_id", "tournamentId", "tournament_id"]);

  if (!runId) {
    throw new Error("runId is required.");
  }

  const run = readRunOrThrow(nk, runId);
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  assertPublicRunVisible(run, nakamaTournament);

  return JSON.stringify({
    ok: true,
    tournament: buildPublicTournamentResponse(
      run,
      nakamaTournament,
      readMembership(nk, run.runId, userId),
    ),
  });
};

export const rpcGetPublicTournamentStandings = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload(payload);
  const runId = readStringField(parsed, ["runId", "run_id", "tournamentRunId", "tournament_run_id", "tournamentId", "tournament_id"]);

  if (!runId) {
    throw new Error("runId is required.");
  }

  const run = readRunOrThrow(nk, runId);
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  assertPublicRunVisible(run, nakamaTournament);
  const limit = clampInteger(
    parsed.limit ?? run.maxSize,
    Math.max(DEFAULT_PUBLIC_STANDINGS_LIMIT, run.maxSize),
    1,
    MAX_STANDINGS_LIMIT,
  );
  const standings = buildStandingsSnapshot(nk, run.tournamentId, limit, 0);

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
  const runId = readStringField(parsed, ["runId", "run_id", "tournamentRunId", "tournament_run_id", "tournamentId", "tournament_id"]);

  if (!runId) {
    throw new Error("runId is required.");
  }

  const run = readRunOrThrow(nk, runId);
  const nakamaTournamentBeforeJoin = getNakamaTournamentById(nk, run.tournamentId);
  assertPublicRunVisible(run, nakamaTournamentBeforeJoin);

  const existingMembership = readMembership(nk, run.runId, userId);
  const displayName = getActorLabel(ctx);
  let joined = false;

  if (!existingMembership) {
    const entrantsBeforeJoin = Math.max(0, Math.floor(readNumberField(nakamaTournamentBeforeJoin, ["size"]) ?? 0));
    const maxEntrants = Math.max(
      0,
      Math.floor(readNumberField(nakamaTournamentBeforeJoin, ["maxSize", "max_size"]) ?? run.maxSize),
    );

    if (maxEntrants > 0 && entrantsBeforeJoin >= maxEntrants) {
      throw new Error("This tournament is already full.");
    }

    nk.tournamentJoin(run.tournamentId, userId, displayName);
    writeMembership(nk, run, userId, displayName);
    joined = true;

    appendTournamentAuditEntry(ctx, logger, nk, { id: run.runId, name: run.title }, "tournament.public_joined", {
      joinedUserId: userId,
      displayName,
    });
  }

  return JSON.stringify({
    ok: true,
    joined,
    tournament: buildPublicTournamentResponse(
      run,
      getNakamaTournamentById(nk, run.tournamentId),
      readMembership(nk, run.runId, userId),
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
  const runId = readStringField(parsed, ["runId", "run_id", "tournamentRunId", "tournament_run_id", "tournamentId", "tournament_id"]);

  if (!runId) {
    throw new Error("runId is required.");
  }

  const run = readRunOrThrow(nk, runId);
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  assertPublicRunVisible(run, nakamaTournament);

  const membership = readMembership(nk, run.runId, userId);
  if (!membership) {
    throw new Error("Join this tournament before launching a match.");
  }

  const nowMs = Date.now();
  const startAtMs = run.startTime > 0 ? run.startTime * 1000 : 0;
  if (startAtMs > nowMs) {
    throw new Error("This tournament has not started yet.");
  }

  const metadata = readMetadata(run);
  const modeId = readStringField(metadata, ["gameMode", "game_mode"]) ?? "standard";
  const rewardSettings = resolveTournamentXpRewardSettings(metadata);

  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const queueState = readQueueState(nk, run.runId);
    const activeQueue =
      queueState.queue && !queueState.queue.claimedByUserId && !isQueueExpired(queueState.queue, nowMs)
        ? queueState.queue
        : null;

    if (activeQueue && activeQueue.hostUserId === userId) {
      return JSON.stringify({
        ok: true,
        matchId: activeQueue.matchId,
        matchToken: null,
        tournamentRunId: run.runId,
        tournamentId: run.tournamentId,
        playerState: "waiting",
        nextRoundReady: false,
        queueStatus: "waiting_for_opponent",
        statusMessage: "Waiting for opponent to join.",
      });
    }

    if (activeQueue && activeQueue.hostUserId !== userId) {
      const claimedQueue: TournamentMatchQueueRecord = {
        ...activeQueue,
        updatedAt: new Date(nowMs).toISOString(),
        claimedByUserId: userId,
        claimedAt: new Date(nowMs).toISOString(),
      };

      try {
        nk.storageWrite([
          maybeSetStorageVersion({
            collection: TOURNAMENT_MATCH_QUEUE_COLLECTION,
            key: run.runId,
            userId: SYSTEM_USER_ID,
            value: claimedQueue,
            permissionRead: STORAGE_PERMISSION_NONE,
            permissionWrite: STORAGE_PERMISSION_NONE,
          }, getStorageObjectVersion(queueState.object)),
        ]);

        appendTournamentAuditEntry(ctx, logger, nk, { id: run.runId, name: run.title }, "tournament.match_launch.claimed", {
          matchId: activeQueue.matchId,
          hostUserId: activeQueue.hostUserId,
          guestUserId: userId,
        });

        return JSON.stringify({
          ok: true,
          matchId: activeQueue.matchId,
          matchToken: null,
          tournamentRunId: run.runId,
          tournamentId: run.tournamentId,
          playerState: "matched",
          nextRoundReady: true,
          queueStatus: "matched",
          statusMessage: "Opponent found.",
        });
      } catch (error) {
        if (attempt === MAX_WRITE_ATTEMPTS) {
          throw error;
        }

        logger.warn(
          "Retrying tournament queue claim for %s after storage conflict: %s",
          run.runId,
          getErrorMessage(error),
        );
        continue;
      }
    }

    const createdAt = new Date(nowMs).toISOString();
    const expiresAt = new Date(nowMs + TOURNAMENT_QUEUE_TTL_SECONDS * 1000).toISOString();
    const matchId = nk.matchCreate("authoritative_match", {
      playerIds: [userId],
      modeId,
      rankedMatch: true,
      casualMatch: false,
      botMatch: false,
      privateMatch: false,
      winRewardSource: "pvp_win",
      allowsChallengeRewards: true,
      tournamentRunId: run.runId,
      tournamentId: run.tournamentId,
      tournamentMatchWinXp: rewardSettings.xpPerMatchWin,
      tournamentChampionXp: rewardSettings.xpForTournamentChampion,
      // Current public tournaments operate as elimination runs: a loss ends the player's run.
      tournamentEliminationRisk: true,
    });
    const nextQueue: TournamentMatchQueueRecord = {
      runId: run.runId,
      tournamentId: run.tournamentId,
      matchId,
      hostUserId: userId,
      modeId,
      createdAt,
      updatedAt: createdAt,
      expiresAt,
      claimedByUserId: null,
      claimedAt: null,
    };

    try {
      nk.storageWrite([
        maybeSetStorageVersion({
          collection: TOURNAMENT_MATCH_QUEUE_COLLECTION,
          key: run.runId,
          userId: SYSTEM_USER_ID,
          value: nextQueue,
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE,
        }, getStorageObjectVersion(queueState.object)),
      ]);

      appendTournamentAuditEntry(ctx, logger, nk, { id: run.runId, name: run.title }, "tournament.match_launch.created", {
        matchId,
        hostUserId: userId,
      });

      return JSON.stringify({
        ok: true,
        matchId,
        matchToken: null,
        tournamentRunId: run.runId,
        tournamentId: run.tournamentId,
        playerState: "waiting",
        nextRoundReady: false,
        queueStatus: "waiting_for_opponent",
        statusMessage: "Waiting for opponent to join.",
      });
    } catch (error) {
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }

      logger.warn(
        "Retrying tournament queue create for %s after storage conflict: %s",
        run.runId,
        getErrorMessage(error),
      );
    }
  }

  throw new Error("Unable to launch a tournament match right now.");
};

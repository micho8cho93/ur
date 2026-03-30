import { asRecord } from "../progression";
import { listTournamentAuditEntries } from "./audit";
import {
  clampInteger,
  getNakamaTournamentById,
  readRunIndexState,
  readRunOrThrow,
  readRunsByIds,
  sortRuns,
  type RunLifecycle,
  type TournamentRunRecord,
} from "./admin";
import { assertAdmin } from "./auth";
import {
  getTournamentBracketCurrentRound,
  type TournamentBracketEntry,
  type TournamentBracketParticipant,
  type TournamentBracketParticipantState,
  type TournamentBracketState,
} from "./bracket";
import { parseJsonPayload, readNumberField, readStringField } from "./definitions";
import type {
  RuntimeContext,
  RuntimeLogger,
  RuntimeNakama,
  TournamentAuditEntry,
} from "./types";

export const RPC_ADMIN_GET_TOURNAMENT_LIVE_STATUS = "rpc_admin_get_tournament_live_status";

type TournamentLiveAlertLevel = "info" | "warning" | "critical" | "success";

export type TournamentLiveAlert = {
  code:
    | "starting_soon"
    | "ready_matches"
    | "active_matches"
    | "waiting_players"
    | "stale_match"
    | "finalize_ready"
    | "finalized";
  level: TournamentLiveAlertLevel;
  message: string;
  count: number;
};

export type TournamentParticipantStateCounts = {
  lobby: number;
  inMatch: number;
  waitingNextRound: number;
  eliminated: number;
  runnerUp: number;
  champion: number;
};

export type TournamentRoundStats = {
  round: number;
  label: string;
  totalMatches: number;
  pending: number;
  ready: number;
  inMatch: number;
  completed: number;
  completionPercent: number;
};

export type TournamentLiveEntry = {
  entryId: string;
  round: number;
  slot: number;
  status: TournamentBracketEntry["status"];
  playerAUserId: string | null;
  playerADisplayName: string | null;
  playerBUserId: string | null;
  playerBDisplayName: string | null;
  winnerUserId: string | null;
  loserUserId: string | null;
  matchId: string | null;
  readyAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationSeconds: number | null;
  stale: boolean;
  staleReason: string | null;
  blockedReason: string | null;
};

export type TournamentLiveSummary = {
  runId: string;
  tournamentId: string;
  title: string;
  lifecycle: RunLifecycle;
  startAt: string | null;
  openedAt: string | null;
  closedAt: string | null;
  finalizedAt: string | null;
  updatedAt: string;
  entrants: number;
  capacity: number;
  registrationFillPercent: number;
  currentRound: number | null;
  totalRounds: number | null;
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  readyMatches: number;
  activeMatches: number;
  waitingPlayers: number;
  playersInMatch: number;
  lastActivityAt: string | null;
  lastResultAt: string | null;
  startingSoon: boolean;
  finalizeReady: boolean;
  actionNeeded: boolean;
  urgencyScore: number;
  alerts: TournamentLiveAlert[];
};

type TimeBucketCount = {
  bucketStart: string;
  bucketEnd: string;
  count: number;
};

type ActiveMatchesByRound = {
  round: number;
  count: number;
};

type MatchDurationBucket = {
  label: string;
  minSeconds: number | null;
  maxSeconds: number | null;
  count: number;
};

type SeedSurvivalPoint = {
  round: number;
  label: string;
  survivingCount: number;
  topSeedRemaining: number | null;
  averageSeedRemaining: number | null;
};

type TournamentLiveDetailResponse = {
  ok: true;
  generatedAt: string;
  summary: TournamentLiveSummary;
  roundStats: TournamentRoundStats[];
  participantStateCounts: TournamentParticipantStateCounts;
  liveEntries: TournamentLiveEntry[];
  matchDurationBuckets: MatchDurationBucket[];
  seedSurvival: SeedSurvivalPoint[];
  auditActivityTimeline: TimeBucketCount[];
};

type TournamentLiveOverviewResponse = {
  ok: true;
  generatedAt: string;
  summaries: TournamentLiveSummary[];
  activeMatchesByRound: ActiveMatchesByRound[];
  completionsOverTime: TimeBucketCount[];
  auditActivityTimeline: TimeBucketCount[];
};

const STARTING_SOON_WINDOW_MS = 60 * 60 * 1000;
const READY_STALE_WINDOW_MS = 10 * 60 * 1000;
const IN_MATCH_STALE_WINDOW_MS = 25 * 60 * 1000;
const RECENT_RUN_WINDOW_MS = 72 * 60 * 60 * 1000;
const DEFAULT_OVERVIEW_LIMIT = 12;
const MAX_OVERVIEW_LIMIT = 50;
const OVERVIEW_TIMELINE_BUCKET_COUNT = 8;
const OVERVIEW_TIMELINE_BUCKET_HOURS = 6;
const DETAIL_TIMELINE_BUCKET_COUNT = 8;
const DETAIL_TIMELINE_BUCKET_HOURS = 3;

const parseIsoMs = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const maxIso = (...values: Array<string | null | undefined>): string | null => {
  const timestamps = values
    .map((value) => (typeof value === "string" ? parseIsoMs(value) : null))
    .filter((value): value is number => value !== null);

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
};

const toIsoFromUnixSeconds = (seconds: number | null): string | null => {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return new Date(seconds * 1000).toISOString();
};

const formatCountLabel = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : plural}`;

const describeElapsedMinutes = (durationMs: number): string => {
  const minutes = Math.max(1, Math.round(durationMs / 60000));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
};

const buildParticipantNameMap = (run: TournamentRunRecord): Map<string, string> => {
  const names = new Map<string, string>();

  run.registrations.forEach((registration) => {
    names.set(registration.userId, registration.displayName);
  });

  run.bracket?.participants.forEach((participant) => {
    names.set(participant.userId, participant.displayName);
  });

  run.finalSnapshot?.records.forEach((record) => {
    const normalized = asRecord(record);
    const ownerId = readStringField(normalized, ["ownerId", "owner_id"]);
    const username = readStringField(normalized, ["username"]);
    if (ownerId && username) {
      names.set(ownerId, username);
    }
  });

  return names;
};

const getEntrantCount = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
): number => {
  const nakamaSize = readNumberField(nakamaTournament, ["size", "size"]);
  return Math.max(
    run.registrations.length,
    typeof nakamaSize === "number" && Number.isFinite(nakamaSize) ? Math.floor(nakamaSize) : 0,
  );
};

const createEmptyParticipantStateCounts = (): TournamentParticipantStateCounts => ({
  lobby: 0,
  inMatch: 0,
  waitingNextRound: 0,
  eliminated: 0,
  runnerUp: 0,
  champion: 0,
});

const incrementParticipantStateCount = (
  counts: TournamentParticipantStateCounts,
  state: TournamentBracketParticipantState,
): void => {
  if (state === "in_match") {
    counts.inMatch += 1;
    return;
  }

  if (state === "waiting_next_round") {
    counts.waitingNextRound += 1;
    return;
  }

  if (state === "eliminated") {
    counts.eliminated += 1;
    return;
  }

  if (state === "runner_up") {
    counts.runnerUp += 1;
    return;
  }

  if (state === "champion") {
    counts.champion += 1;
    return;
  }

  counts.lobby += 1;
};

const buildParticipantStateCounts = (run: TournamentRunRecord): TournamentParticipantStateCounts => {
  const counts = createEmptyParticipantStateCounts();
  const participants = run.bracket?.participants ?? [];

  if (participants.length === 0) {
    counts.lobby = run.registrations.length;
    return counts;
  }

  participants.forEach((participant) => {
    incrementParticipantStateCount(counts, participant.state);
  });

  return counts;
};

const getRoundLabel = (round: number, totalRounds: number | null): string => {
  if (typeof totalRounds === "number" && round === totalRounds) {
    return "Final";
  }

  return `Round ${round}`;
};

const getEntryDurationSeconds = (entry: TournamentBracketEntry): number | null => {
  const startedAtMs = parseIsoMs(entry.startedAt);
  const completedAtMs = parseIsoMs(entry.completedAt);

  if (startedAtMs === null || completedAtMs === null || completedAtMs < startedAtMs) {
    return null;
  }

  return Math.floor((completedAtMs - startedAtMs) / 1000);
};

const isReadyEntryStale = (entry: TournamentBracketEntry, nowMs: number): boolean => {
  if (entry.status !== "ready") {
    return false;
  }

  const readyAtMs = parseIsoMs(entry.readyAt ?? entry.updatedAt);
  return readyAtMs !== null && nowMs - readyAtMs >= READY_STALE_WINDOW_MS;
};

const isInMatchEntryStale = (entry: TournamentBracketEntry, nowMs: number): boolean => {
  if (entry.status !== "in_match") {
    return false;
  }

  const startedAtMs = parseIsoMs(entry.startedAt ?? entry.updatedAt);
  return startedAtMs !== null && nowMs - startedAtMs >= IN_MATCH_STALE_WINDOW_MS;
};

const buildEntryBlockedReason = (
  entry: TournamentBracketEntry,
  nameByUserId: Map<string, string>,
): string | null => {
  if (entry.status === "pending") {
    if (entry.playerAUserId && !entry.playerBUserId) {
      return `${nameByUserId.get(entry.playerAUserId) ?? entry.playerAUserId} is waiting for an opponent.`;
    }

    if (!entry.playerAUserId && entry.playerBUserId) {
      return `${nameByUserId.get(entry.playerBUserId) ?? entry.playerBUserId} is waiting for an opponent.`;
    }

    if (entry.sourceEntryIds.length > 0) {
      return `Waiting for winners from ${entry.sourceEntryIds.join(", ")}.`;
    }

    return "Waiting for the bracket to resolve upstream results.";
  }

  return null;
};

const buildEntryStaleReason = (entry: TournamentBracketEntry, nowMs: number): string | null => {
  if (entry.status === "ready") {
    const readyAtMs = parseIsoMs(entry.readyAt ?? entry.updatedAt);
    if (readyAtMs !== null && nowMs - readyAtMs >= READY_STALE_WINDOW_MS) {
      return `Ready for ${describeElapsedMinutes(nowMs - readyAtMs)} without a match launch.`;
    }
  }

  if (entry.status === "in_match") {
    const startedAtMs = parseIsoMs(entry.startedAt ?? entry.updatedAt);
    if (startedAtMs !== null && nowMs - startedAtMs >= IN_MATCH_STALE_WINDOW_MS) {
      return `In match for ${describeElapsedMinutes(nowMs - startedAtMs)} without a result.`;
    }
  }

  return null;
};

const sortLiveEntries = (entries: TournamentLiveEntry[]): TournamentLiveEntry[] => {
  const statusPriority: Record<TournamentLiveEntry["status"], number> = {
    in_match: 0,
    ready: 1,
    pending: 2,
    completed: 3,
  };

  return entries.slice().sort((left, right) => {
    if (statusPriority[left.status] !== statusPriority[right.status]) {
      return statusPriority[left.status] - statusPriority[right.status];
    }

    if (left.round !== right.round) {
      return left.round - right.round;
    }

    return left.slot - right.slot;
  });
};

const buildLiveEntries = (
  run: TournamentRunRecord,
  nowMs: number,
): TournamentLiveEntry[] => {
  const nameByUserId = buildParticipantNameMap(run);

  return sortLiveEntries(
    (run.bracket?.entries ?? []).map((entry) => {
      const staleReason = buildEntryStaleReason(entry, nowMs);
      return {
        entryId: entry.entryId,
        round: entry.round,
        slot: entry.slot,
        status: entry.status,
        playerAUserId: entry.playerAUserId,
        playerADisplayName: entry.playerAUserId
          ? (nameByUserId.get(entry.playerAUserId) ?? entry.playerAUserId)
          : null,
        playerBUserId: entry.playerBUserId,
        playerBDisplayName: entry.playerBUserId
          ? (nameByUserId.get(entry.playerBUserId) ?? entry.playerBUserId)
          : null,
        winnerUserId: entry.winnerUserId,
        loserUserId: entry.loserUserId,
        matchId: entry.matchId,
        readyAt: entry.readyAt,
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
        durationSeconds: getEntryDurationSeconds(entry),
        stale: staleReason !== null,
        staleReason,
        blockedReason: buildEntryBlockedReason(entry, nameByUserId),
      };
    }),
  );
};

const buildRoundStats = (bracket: TournamentBracketState | null): TournamentRoundStats[] => {
  if (!bracket || bracket.entries.length === 0) {
    return [];
  }

  const rounds = Array.from(new Set(bracket.entries.map((entry) => entry.round))).sort((left, right) => left - right);

  return rounds.map((round) => {
    const entries = bracket.entries.filter((entry) => entry.round === round);
    const pending = entries.filter((entry) => entry.status === "pending").length;
    const ready = entries.filter((entry) => entry.status === "ready").length;
    const inMatch = entries.filter((entry) => entry.status === "in_match").length;
    const completed = entries.filter((entry) => entry.status === "completed").length;
    return {
      round,
      label: getRoundLabel(round, bracket.totalRounds),
      totalMatches: entries.length,
      pending,
      ready,
      inMatch,
      completed,
      completionPercent: entries.length > 0 ? Math.round((completed / entries.length) * 100) : 0,
    };
  });
};

const buildTournamentLiveSummary = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
  auditEntries: TournamentAuditEntry[],
  nowMs: number,
): TournamentLiveSummary => {
  const participantCounts = buildParticipantStateCounts(run);
  const roundStats = buildRoundStats(run.bracket);
  const entries = run.bracket?.entries ?? [];
  const totalMatches = entries.length;
  const completedMatches = roundStats.reduce((total, round) => total + round.completed, 0);
  const pendingMatches = roundStats.reduce((total, round) => total + round.pending, 0);
  const readyMatches = roundStats.reduce((total, round) => total + round.ready, 0);
  const activeMatches = roundStats.reduce((total, round) => total + round.inMatch, 0);
  const staleEntryCount = entries.filter((entry) =>
    isReadyEntryStale(entry, nowMs) || isInMatchEntryStale(entry, nowMs),
  ).length;
  const startAt =
    toIsoFromUnixSeconds(readNumberField(nakamaTournament, ["startTime", "start_time"]) ?? run.startTime) ??
    null;
  const currentRound = getTournamentBracketCurrentRound(run.bracket);
  const lastResultAt = entries.reduce<string | null>(
    (latest, entry) => maxIso(latest, entry.completedAt),
    null,
  );
  const lastActivityAt = maxIso(
    run.updatedAt,
    lastResultAt,
    ...entries.flatMap((entry) => [entry.updatedAt, entry.readyAt, entry.startedAt, entry.completedAt]),
    ...auditEntries.map((entry) => entry.createdAt),
  );
  const finalizedFromBracket =
    Boolean(run.bracket?.finalizedAt) || (totalMatches > 0 && completedMatches === totalMatches);
  const finalizeReady = run.lifecycle !== "finalized" && finalizedFromBracket;
  const startingSoon = (() => {
    const startAtMs = parseIsoMs(startAt);
    return (
      startAtMs !== null &&
      startAtMs > nowMs &&
      startAtMs - nowMs <= STARTING_SOON_WINDOW_MS &&
      run.lifecycle !== "finalized"
    );
  })();

  const alerts: TournamentLiveAlert[] = [];
  if (staleEntryCount > 0) {
    alerts.push({
      code: "stale_match",
      level: "critical",
      message: `${formatCountLabel(staleEntryCount, "stale match")} needs operator attention.`,
      count: staleEntryCount,
    });
  }

  if (readyMatches > 0) {
    alerts.push({
      code: "ready_matches",
      level: "warning",
      message: `${formatCountLabel(readyMatches, "match")} ready to launch.`,
      count: readyMatches,
    });
  }

  if (activeMatches > 0) {
    alerts.push({
      code: "active_matches",
      level: "info",
      message: `${formatCountLabel(activeMatches, "active match")} in progress.`,
      count: activeMatches,
    });
  }

  if (participantCounts.waitingNextRound > 0) {
    alerts.push({
      code: "waiting_players",
      level: readyMatches > 0 || activeMatches > 0 ? "info" : "warning",
      message: `${formatCountLabel(participantCounts.waitingNextRound, "player")} waiting for the next round.`,
      count: participantCounts.waitingNextRound,
    });
  }

  if (startingSoon) {
    alerts.push({
      code: "starting_soon",
      level: "info",
      message: "Run starts within the next hour.",
      count: 1,
    });
  }

  if (finalizeReady) {
    alerts.push({
      code: "finalize_ready",
      level: "success",
      message: "Bracket is complete and ready to finalize.",
      count: 1,
    });
  }

  if (run.lifecycle === "finalized") {
    alerts.push({
      code: "finalized",
      level: "success",
      message: "Run is finalized and export-ready.",
      count: 1,
    });
  }

  const actionNeeded = alerts.some((alert) => alert.level === "warning" || alert.level === "critical");
  const entrants = getEntrantCount(run, nakamaTournament);
  const capacity = Math.max(run.maxSize, entrants);
  const registrationFillPercent = capacity > 0 ? Math.round((entrants / capacity) * 100) : 0;

  const urgencyScore =
    (staleEntryCount * 100) +
    (readyMatches * 35) +
    (activeMatches * 20) +
    (participantCounts.waitingNextRound * 8) +
    (startingSoon ? 15 : 0) +
    (run.lifecycle === "open" ? 10 : 0) +
    (finalizeReady ? 5 : 0);

  return {
    runId: run.runId,
    tournamentId: run.tournamentId,
    title: run.title,
    lifecycle: run.lifecycle,
    startAt,
    openedAt: run.openedAt,
    closedAt: run.closedAt,
    finalizedAt: run.finalizedAt ?? run.bracket?.finalizedAt ?? null,
    updatedAt: run.updatedAt,
    entrants,
    capacity,
    registrationFillPercent,
    currentRound,
    totalRounds: run.bracket?.totalRounds ?? run.maxNumScore ?? null,
    totalMatches,
    completedMatches,
    pendingMatches,
    readyMatches,
    activeMatches,
    waitingPlayers: participantCounts.waitingNextRound,
    playersInMatch: participantCounts.inMatch,
    lastActivityAt,
    lastResultAt,
    startingSoon,
    finalizeReady,
    actionNeeded,
    urgencyScore,
    alerts,
  };
};

const buildTimelineBuckets = (
  timestamps: string[],
  nowMs: number,
  bucketCount: number,
  bucketHours: number,
): TimeBucketCount[] => {
  const bucketWidthMs = bucketHours * 60 * 60 * 1000;
  const firstBucketStartMs = nowMs - bucketWidthMs * (bucketCount - 1);

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStartMs = firstBucketStartMs + index * bucketWidthMs;
    const bucketEndMs = bucketStartMs + bucketWidthMs;
    return {
      bucketStart: new Date(bucketStartMs).toISOString(),
      bucketEnd: new Date(bucketEndMs).toISOString(),
      count: timestamps.reduce((total, timestamp) => {
        const parsed = parseIsoMs(timestamp);
        return parsed !== null && parsed >= bucketStartMs && parsed < bucketEndMs ? total + 1 : total;
      }, 0),
    };
  });
};

const buildMatchDurationBuckets = (bracket: TournamentBracketState | null): MatchDurationBucket[] => {
  const durations = (bracket?.entries ?? [])
    .map((entry) => getEntryDurationSeconds(entry))
    .filter((duration): duration is number => duration !== null);

  const buckets: Array<Omit<MatchDurationBucket, "count"> & { count: number }> = [
    { label: "<5m", minSeconds: 0, maxSeconds: 5 * 60, count: 0 },
    { label: "5-10m", minSeconds: 5 * 60, maxSeconds: 10 * 60, count: 0 },
    { label: "10-15m", minSeconds: 10 * 60, maxSeconds: 15 * 60, count: 0 },
    { label: "15-20m", minSeconds: 15 * 60, maxSeconds: 20 * 60, count: 0 },
    { label: "20m+", minSeconds: 20 * 60, maxSeconds: null, count: 0 },
  ];

  durations.forEach((duration) => {
    const bucket =
      buckets.find((candidate) => {
        if (candidate.maxSeconds === null) {
          return duration >= candidate.minSeconds;
        }

        return duration >= candidate.minSeconds && duration < candidate.maxSeconds;
      }) ?? buckets[buckets.length - 1];

    bucket.count += 1;
  });

  return buckets;
};

const buildSeedSurvival = (bracket: TournamentBracketState | null): SeedSurvivalPoint[] => {
  if (!bracket || bracket.participants.length === 0) {
    return [];
  }

  const seedByUserId = bracket.participants.reduce<Record<string, number>>((accumulator, participant) => {
    accumulator[participant.userId] = participant.seed;
    return accumulator;
  }, {});
  const remainingUserIds = new Set(bracket.participants.map((participant) => participant.userId));

  return Array.from({ length: bracket.totalRounds }, (_, index) => index + 1).map((round) => {
    bracket.entries
      .filter((entry) => entry.round === round && entry.status === "completed" && entry.loserUserId)
      .forEach((entry) => {
        if (entry.loserUserId) {
          remainingUserIds.delete(entry.loserUserId);
        }
      });

    const remainingSeeds = Array.from(remainingUserIds)
      .map((userId) => seedByUserId[userId])
      .filter((seed): seed is number => typeof seed === "number" && Number.isFinite(seed))
      .sort((left, right) => left - right);
    const averageSeedRemaining =
      remainingSeeds.length > 0
        ? Number((remainingSeeds.reduce((total, seed) => total + seed, 0) / remainingSeeds.length).toFixed(2))
        : null;

    return {
      round,
      label: getRoundLabel(round, bracket.totalRounds),
      survivingCount: remainingSeeds.length,
      topSeedRemaining: remainingSeeds[0] ?? null,
      averageSeedRemaining,
    };
  });
};

const compareSummariesByUrgency = (
  left: TournamentLiveSummary,
  right: TournamentLiveSummary,
): number => {
  if (left.urgencyScore !== right.urgencyScore) {
    return right.urgencyScore - left.urgencyScore;
  }

  const leftActivity = parseIsoMs(left.lastActivityAt ?? left.updatedAt) ?? 0;
  const rightActivity = parseIsoMs(right.lastActivityAt ?? right.updatedAt) ?? 0;
  if (leftActivity !== rightActivity) {
    return rightActivity - leftActivity;
  }

  return left.runId.localeCompare(right.runId);
};

const isOverviewCandidate = (summary: TournamentLiveSummary, nowMs: number): boolean => {
  if (summary.lifecycle !== "finalized") {
    return true;
  }

  const recentActivityMs = parseIsoMs(summary.lastActivityAt ?? summary.finalizedAt ?? summary.updatedAt);
  return recentActivityMs !== null && nowMs - recentActivityMs <= RECENT_RUN_WINDOW_MS;
};

const buildOverviewResponse = (
  nk: RuntimeNakama,
  limit: number,
): TournamentLiveOverviewResponse => {
  const generatedAt = new Date().toISOString();
  const nowMs = parseIsoMs(generatedAt) ?? Date.now();
  const indexState = readRunIndexState(nk);
  const runs = sortRuns(readRunsByIds(nk, indexState.index.runIds));
  const auditEntries = listTournamentAuditEntries(nk, { limit: 200 });
  const auditsByRunId = auditEntries.reduce<Record<string, TournamentAuditEntry[]>>((accumulator, entry) => {
    const runId = entry.tournamentId || entry.targetId;
    if (!runId) {
      return accumulator;
    }

    accumulator[runId] = accumulator[runId] ?? [];
    accumulator[runId].push(entry);
    return accumulator;
  }, {});
  const tournamentsById = runs.reduce<Record<string, Record<string, unknown> | null>>((accumulator, run) => {
    accumulator[run.runId] = getNakamaTournamentById(nk, run.tournamentId);
    return accumulator;
  }, {});

  const summaries = runs
    .map((run) => buildTournamentLiveSummary(run, tournamentsById[run.runId] ?? null, auditsByRunId[run.runId] ?? [], nowMs))
    .filter((summary) => isOverviewCandidate(summary, nowMs))
    .sort(compareSummariesByUrgency)
    .slice(0, limit);
  const includedRunIds = new Set(summaries.map((summary) => summary.runId));

  const activeMatchesByRound = runs
    .filter((run) => includedRunIds.has(run.runId))
    .flatMap((run) => buildRoundStats(run.bracket))
    .reduce<Record<number, number>>((accumulator, round) => {
      accumulator[round.round] = (accumulator[round.round] ?? 0) + round.inMatch;
      return accumulator;
    }, {});

  const completionTimestamps = runs
    .filter((run) => includedRunIds.has(run.runId))
    .flatMap((run) => (run.bracket?.entries ?? []).map((entry) => entry.completedAt).filter((value): value is string => Boolean(value)));
  const auditTimestamps = auditEntries
    .filter((entry) => {
      const runId = entry.tournamentId ?? entry.targetId;
      return typeof runId === "string" && includedRunIds.has(runId);
    })
    .map((entry) => entry.createdAt);

  return {
    ok: true,
    generatedAt,
    summaries,
    activeMatchesByRound: Object.keys(activeMatchesByRound)
      .map((round) => ({
        round: Number(round),
        count: activeMatchesByRound[Number(round)] ?? 0,
      }))
      .sort((left, right) => left.round - right.round),
    completionsOverTime: buildTimelineBuckets(
      completionTimestamps,
      nowMs,
      OVERVIEW_TIMELINE_BUCKET_COUNT,
      OVERVIEW_TIMELINE_BUCKET_HOURS,
    ),
    auditActivityTimeline: buildTimelineBuckets(
      auditTimestamps,
      nowMs,
      OVERVIEW_TIMELINE_BUCKET_COUNT,
      OVERVIEW_TIMELINE_BUCKET_HOURS,
    ),
  };
};

const buildDetailResponse = (
  nk: RuntimeNakama,
  runId: string,
): TournamentLiveDetailResponse => {
  const generatedAt = new Date().toISOString();
  const nowMs = parseIsoMs(generatedAt) ?? Date.now();
  const run = readRunOrThrow(nk, runId);
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  const auditEntries = listTournamentAuditEntries(nk, {
    tournamentId: run.runId,
    limit: 200,
  });

  return {
    ok: true,
    generatedAt,
    summary: buildTournamentLiveSummary(run, nakamaTournament, auditEntries, nowMs),
    roundStats: buildRoundStats(run.bracket),
    participantStateCounts: buildParticipantStateCounts(run),
    liveEntries: buildLiveEntries(run, nowMs),
    matchDurationBuckets: buildMatchDurationBuckets(run.bracket),
    seedSurvival: buildSeedSurvival(run.bracket),
    auditActivityTimeline: buildTimelineBuckets(
      auditEntries.map((entry) => entry.createdAt),
      nowMs,
      DETAIL_TIMELINE_BUCKET_COUNT,
      DETAIL_TIMELINE_BUCKET_HOURS,
    ),
  };
};

export const rpcAdminGetTournamentLiveStatus = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  assertAdmin(ctx, "viewer", nk);
  const parsed = parseJsonPayload(payload);
  const runId = readStringField(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);

  if (runId) {
    return JSON.stringify(buildDetailResponse(nk, runId));
  }

  const limit = clampInteger(parsed.limit, DEFAULT_OVERVIEW_LIMIT, 1, MAX_OVERVIEW_LIMIT);
  return JSON.stringify(buildOverviewResponse(nk, limit));
};

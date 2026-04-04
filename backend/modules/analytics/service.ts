import { DEFAULT_ELO_RATING, ELO_LEADERBOARD_ID, sanitizeEloRating } from "../../../shared/elo";
import { PROGRESSION_RANKS } from "../../../shared/progression";
import { isTournamentBotUserId } from "../../../shared/tournamentBots";
import { PROGRESSION_COLLECTION, PROGRESSION_PROFILE_KEY } from "../progression";
import { readRunIndexState, readRunsByIds, type TournamentRunRecord } from "../tournaments/admin";
import { TOURNAMENT_MATCH_RESULTS_COLLECTION, type TournamentMatchResultRecord } from "../tournaments/matchResults";
import { USERNAME_PROFILE_COLLECTION, USERNAME_PROFILE_KEY } from "../usernameOnboarding";
import {
  available,
  mergeAvailability,
  noData,
  notEnoughData,
  partial,
  toResponseAvailability,
  trackingMissing,
} from "./availability";
import { DAY_BUCKET_MS, isWithinRange, parseAnalyticsFilters, toResponseFilters } from "./filters";
import {
  getOnlinePresenceSnapshot,
  listActiveTrackedMatches,
  listAnalyticsEvents,
  type AnalyticsMatchClassification,
  type MatchEndAnalyticsEvent,
  type MatchStartAnalyticsEvent,
  type XpAwardAnalyticsEvent,
} from "./tracking";
import type {
  AnalyticsAvailability,
  AnalyticsFilters,
  AnalyticsGameplayData,
  AnalyticsMetric,
  AnalyticsOverviewData,
  AnalyticsPlayersData,
  AnalyticsProgressionData,
  AnalyticsRealtimeData,
  AnalyticsResponse,
  AnalyticsSummaryData,
  AnalyticsTableRow,
  AnalyticsTournamentsData,
  CountPoint,
  DistributionBucket,
  DualCountPoint,
  RatePoint,
  RealtimeEventRow,
  RankedSegment,
} from "./types";

type RuntimeLogger = any;
type RuntimeNakama = any;
type RuntimeRecord = Record<string, unknown>;

type HistoricalMatchPlayer = {
  userId: string;
  username: string | null;
  color: "light" | "dark" | null;
  didWin: boolean | null;
  capturesMade: number | null;
  capturesSuffered: number | null;
  playerMoveCount: number | null;
  finishedCount: number | null;
  isBot: boolean;
};

type HistoricalMatchRecord = {
  source: "tracked" | "tournament" | "elo";
  matchId: string;
  startedAt: string | null;
  endedAt: string;
  durationSeconds: number | null;
  reason: "completed" | "forfeit_inactivity" | "forfeit_disconnect" | null;
  modeId: string | null;
  classification: AnalyticsMatchClassification;
  tournamentRunId: string | null;
  tournamentId: string | null;
  winnerUserId: string | null;
  loserUserId: string | null;
  totalMoves: number | null;
  totalTurns: number | null;
  players: HistoricalMatchPlayer[];
};

type TournamentEntryContext = {
  runId: string;
  tournamentId: string;
  round: number | null;
  startedAt: string | null;
  completedAt: string | null;
  durationSeconds: number | null;
};

type EloLeaderboardRow = {
  userId: string;
  usernameDisplay: string;
  eloRating: number;
  ratedGames: number;
  ratedWins: number;
  ratedLosses: number;
  provisional: boolean;
  rank: number | null;
};

type EloHistoryPlayer = {
  userId: string;
  usernameDisplay: string;
  oldRating: number;
  newRating: number;
  delta: number;
  ratedGames: number;
  ratedWins: number;
  ratedLosses: number;
  provisional: boolean;
};

type EloHistoryRecord = {
  matchId: string;
  processedAt: string;
  winnerUserId: string;
  loserUserId: string;
  playerResults: EloHistoryPlayer[];
};

type KnownUserRecord = {
  userId: string;
  username: string;
  createdAt: string | null;
  totalXp: number | null;
  currentRankTitle: string | null;
  eloRating: number | null;
  ratedGames: number | null;
  ratedWins: number | null;
  ratedLosses: number | null;
};

type UserPerformance = {
  userId: string;
  username: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  tournamentParticipations: number;
  lastActiveAt: string | null;
  firstSeenAt: string | null;
};

type AnalyticsContext = {
  generatedAt: string;
  filters: AnalyticsFilters;
  runs: TournamentRunRecord[];
  tournamentMatches: HistoricalMatchRecord[];
  trackedMatches: HistoricalMatchRecord[];
  eloMatches: HistoricalMatchRecord[];
  unifiedMatches: HistoricalMatchRecord[];
  trackedMatchStarts: MatchStartAnalyticsEvent[];
  trackedMatchEnds: MatchEndAnalyticsEvent[];
  xpAwardEvents: XpAwardAnalyticsEvent[];
  activityEvents: Array<{
    userId: string;
    occurredAt: string;
    source: string;
  }>;
  usersById: Map<string, KnownUserRecord>;
  userPerformanceById: Map<string, UserPerformance>;
  firstSeenByUserId: Map<string, string>;
  leaderboardRows: EloLeaderboardRow[];
  eloHistory: EloHistoryRecord[];
  eventsSupported: boolean;
  eloHistorySupported: boolean;
  runtimeNotes: string[];
};

const MATCH_DURATION_BUCKETS: Array<{ key: string; label: string; min: number; max: number | null }> = [
  { key: "under_5", label: "< 5m", min: 0, max: 5 * 60 },
  { key: "5_10", label: "5-10m", min: 5 * 60, max: 10 * 60 },
  { key: "10_15", label: "10-15m", min: 10 * 60, max: 15 * 60 },
  { key: "15_20", label: "15-20m", min: 15 * 60, max: 20 * 60 },
  { key: "20_plus", label: "20m+", min: 20 * 60, max: null },
];

const TOURNAMENT_DURATION_BUCKETS: Array<{ key: string; label: string; min: number; max: number | null }> = [
  { key: "under_30m", label: "< 30m", min: 0, max: 30 * 60 },
  { key: "30_60m", label: "30-60m", min: 30 * 60, max: 60 * 60 },
  { key: "60_120m", label: "1-2h", min: 60 * 60, max: 120 * 60 },
  { key: "2_6h", label: "2-6h", min: 120 * 60, max: 6 * 60 * 60 },
  { key: "6h_plus", label: "6h+", min: 6 * 60 * 60, max: null },
];

const ELO_BUCKETS: Array<{ key: string; label: string; min: number; max: number | null }> = [
  { key: "below_1000", label: "< 1000", min: Number.NEGATIVE_INFINITY, max: 1000 },
  { key: "1000_1199", label: "1000-1199", min: 1000, max: 1200 },
  { key: "1200_1399", label: "1200-1399", min: 1200, max: 1400 },
  { key: "1400_1599", label: "1400-1599", min: 1400, max: 1600 },
  { key: "1600_plus", label: "1600+", min: 1600, max: null },
];

const PARTICIPATION_BUCKETS: Array<{ key: string; label: string; min: number; max: number | null }> = [
  { key: "1_4", label: "1-4 entrants", min: 1, max: 5 },
  { key: "5_8", label: "5-8 entrants", min: 5, max: 9 },
  { key: "9_16", label: "9-16 entrants", min: 9, max: 17 },
  { key: "17_plus", label: "17+ entrants", min: 17, max: null },
];

const asRecord = (value: unknown): RuntimeRecord | null =>
  typeof value === "object" && value !== null ? (value as RuntimeRecord) : null;

const readStringField = (value: unknown, keys: string[]): string | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "string" && field.trim().length > 0) {
      return field.trim();
    }
  }

  return null;
};

const readNumberField = (value: unknown, keys: string[]): number | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "number" && Number.isFinite(field)) {
      return field;
    }

    if (typeof field === "string" && field.trim().length > 0) {
      const parsed = Number(field);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const readBooleanField = (value: unknown, keys: string[]): boolean | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "boolean") {
      return field;
    }
  }

  return null;
};

const readStringArrayField = (value: unknown, keys: string[]): string[] => {
  const record = asRecord(value);
  if (!record) {
    return [];
  }

  for (const key of keys) {
    const field = record[key];
    if (Array.isArray(field)) {
      return field.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
    }
  }

  return [];
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const batch = <T,>(values: T[], size: number): T[][] => {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
};

const parseIsoMs = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const startOfDayMs = (value: number): number => {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const toDayKey = (value: string | number): string => {
  const timestamp = typeof value === "number" ? value : parseIsoMs(value) ?? Date.now();
  return new Date(startOfDayMs(timestamp)).toISOString().slice(0, 10);
};

const buildDayKeys = (filters: AnalyticsFilters): string[] => {
  const keys: string[] = [];
  let cursor = startOfDayMs(filters.startMs);
  const finalDayMs = startOfDayMs(filters.endMs);

  while (cursor <= finalDayMs) {
    keys.push(new Date(cursor).toISOString().slice(0, 10));
    cursor += DAY_BUCKET_MS;
  }

  return keys;
};

const unique = <T,>(values: T[]): T[] => Array.from(new Set(values));

const median = (values: number[]): number | null => {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[midpoint - 1] + sorted[midpoint]) / 2) * 100) / 100;
  }

  return sorted[midpoint];
};

const toPercentage = (numerator: number, denominator: number): number | null => {
  if (denominator <= 0) {
    return null;
  }

  return Math.round((numerator / denominator) * 1000) / 10;
};

const createMetric = (
  value: number | null,
  availability: AnalyticsAvailability,
  options?: {
    numerator?: number | null;
    denominator?: number | null;
    previousValue?: number | null;
  },
): AnalyticsMetric => ({
  value,
  numerator: options?.numerator ?? null,
  denominator: options?.denominator ?? null,
  previousValue: options?.previousValue ?? null,
  availability,
});

const getRunGameMode = (run: TournamentRunRecord): string =>
  readStringField(run.metadata, ["gameMode", "game_mode"]) ?? "standard";

const runMatchesFilters = (run: TournamentRunRecord, filters: AnalyticsFilters): boolean => {
  if (filters.tournamentId && filters.tournamentId !== run.runId && filters.tournamentId !== run.tournamentId) {
    return false;
  }

  if (filters.gameMode && filters.gameMode !== getRunGameMode(run)) {
    return false;
  }

  return true;
};

const matchesEloFilter = (eloRating: number | null, filters: AnalyticsFilters): boolean => {
  if (filters.eloMin !== null && (eloRating === null || eloRating < filters.eloMin)) {
    return false;
  }

  if (filters.eloMax !== null && (eloRating === null || eloRating > filters.eloMax)) {
    return false;
  }

  return true;
};

const isHumanUserId = (userId: string | null | undefined): userId is string =>
  typeof userId === "string" && userId.trim().length > 0 && !isTournamentBotUserId(userId);

const normalizeTournamentMatchResult = (value: unknown): TournamentMatchResultRecord | null => {
  const record = asRecord(value);
  const resultId = readStringField(record, ["resultId", "result_id"]);
  const matchId = readStringField(record, ["matchId", "match_id"]);
  const runId = readStringField(record, ["runId", "run_id"]);
  const tournamentId = readStringField(record, ["tournamentId", "tournament_id"]);

  if (!record || !resultId || !matchId || !runId || !tournamentId) {
    return null;
  }

  return record as TournamentMatchResultRecord;
};

const normalizeEloHistoryRecord = (value: unknown): EloHistoryRecord | null => {
  const record = asRecord(value);
  const matchId = readStringField(record, ["matchId", "match_id"]);
  const processedAt = readStringField(record, ["processedAt", "processed_at"]);
  const winnerUserId = readStringField(record, ["winnerUserId", "winner_user_id"]);
  const loserUserId = readStringField(record, ["loserUserId", "loser_user_id"]);

  if (!record || !matchId || !processedAt || !winnerUserId || !loserUserId) {
    return null;
  }

  const rawPlayers = Array.isArray(record.playerResults)
    ? record.playerResults
    : Array.isArray(record.player_results)
      ? record.player_results
      : [];

  const playerResults = rawPlayers
    .map((player) => {
      const normalized = asRecord(player);
      const userId = readStringField(normalized, ["userId", "user_id"]);
      const usernameDisplay = readStringField(normalized, ["usernameDisplay", "username_display"]);
      const oldRating = readNumberField(normalized, ["oldRating", "old_rating"]);
      const newRating = readNumberField(normalized, ["newRating", "new_rating"]);
      const delta = readNumberField(normalized, ["delta"]);

      if (
        !normalized ||
        !userId ||
        !usernameDisplay ||
        oldRating === null ||
        newRating === null ||
        delta === null
      ) {
        return null;
      }

      return {
        userId,
        usernameDisplay,
        oldRating,
        newRating,
        delta,
        ratedGames: Math.max(0, Math.floor(readNumberField(normalized, ["ratedGames", "rated_games"]) ?? 0)),
        ratedWins: Math.max(0, Math.floor(readNumberField(normalized, ["ratedWins", "rated_wins"]) ?? 0)),
        ratedLosses: Math.max(0, Math.floor(readNumberField(normalized, ["ratedLosses", "rated_losses"]) ?? 0)),
        provisional: readBooleanField(normalized, ["provisional"]) === true,
      } satisfies EloHistoryPlayer;
    })
    .filter((player): player is EloHistoryPlayer => Boolean(player));

  if (playerResults.length !== 2) {
    return null;
  }

  return {
    matchId,
    processedAt,
    winnerUserId,
    loserUserId,
    playerResults,
  };
};

const normalizeStorageListResult = (
  value: unknown,
): { objects: Array<{ value?: unknown }>; cursor: string | null } => {
  if (Array.isArray(value)) {
    return {
      objects: value.map((entry) => asRecord(entry) ?? {}),
      cursor: null,
    };
  }

  const record = asRecord(value);
  const objects = Array.isArray(record?.objects) ? record.objects.map((entry) => (asRecord(entry) ?? {})) : [];

  return {
    objects,
    cursor: readStringField(record, ["cursor", "nextCursor", "next_cursor"]),
  };
};

const listAllGlobalObjects = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  collection: string,
  userId: string,
): { supported: boolean; notes: string[]; objects: Array<{ value?: unknown }> } => {
  if (typeof nk.storageList !== "function") {
    return {
      supported: false,
      notes: [`Collection listing is not supported for '${collection}' on this runtime.`],
      objects: [],
    };
  }

  const objects: Array<{ value?: unknown }> = [];
  let cursor = "";

  for (let page = 0; page < 50; page += 1) {
    try {
      const rawResult = nk.storageList(userId, collection, 100, cursor);
      const result = normalizeStorageListResult(rawResult);
      objects.push(...result.objects);

      if (!result.cursor) {
        break;
      }

      cursor = result.cursor;
    } catch (error) {
      logger.warn("Unable to list storage collection %s: %s", collection, getErrorMessage(error));
      return {
        supported: false,
        notes: [`Collection listing failed for '${collection}'.`],
        objects: [],
      };
    }
  }

  return {
    supported: true,
    notes: [],
    objects,
  };
};

const getLeaderboardRecordMetadata = (record: unknown): RuntimeRecord | null => asRecord(asRecord(record)?.metadata);

const getLeaderboardRecordOwnerId = (record: unknown): string | null =>
  readStringField(record, ["ownerId", "owner_id"]);

const getLeaderboardRecordUsername = (record: unknown): string | null =>
  readStringField(record, ["username"]);

const getLeaderboardRecordScore = (record: unknown): number | null =>
  readNumberField(record, ["score"]);

const getLeaderboardRecordRank = (record: unknown): number | null =>
  readNumberField(record, ["rank"]);

const listAllLeaderboardRows = (nk: RuntimeNakama): EloLeaderboardRow[] => {
  if (typeof nk.leaderboardRecordsList !== "function") {
    return [];
  }

  const rows: EloLeaderboardRow[] = [];
  let cursor = "";

  for (let page = 0; page < 50; page += 1) {
    const result = asRecord(nk.leaderboardRecordsList(ELO_LEADERBOARD_ID, [], 100, cursor, 0));
    const records = Array.isArray(result?.records) ? result.records : [];

    records.forEach((record) => {
      const userId = getLeaderboardRecordOwnerId(record);
      if (!userId) {
        return;
      }

      const metadata = getLeaderboardRecordMetadata(record);
      const ratedGames = Math.max(0, Math.floor(readNumberField(metadata, ["ratedGames", "rated_games"]) ?? 0));
      rows.push({
        userId,
        usernameDisplay:
          readStringField(metadata, ["usernameDisplay", "username_display"]) ??
          getLeaderboardRecordUsername(record) ??
          userId,
        eloRating: sanitizeEloRating(getLeaderboardRecordScore(record) ?? DEFAULT_ELO_RATING),
        ratedGames,
        ratedWins: Math.max(0, Math.floor(readNumberField(metadata, ["ratedWins", "rated_wins"]) ?? 0)),
        ratedLosses: Math.max(0, Math.floor(readNumberField(metadata, ["ratedLosses", "rated_losses"]) ?? 0)),
        provisional: readBooleanField(metadata, ["provisional"]) === true || ratedGames < 10,
        rank: getLeaderboardRecordRank(record),
      });
    });

    const nextCursor = readStringField(result, ["nextCursor", "next_cursor"]);
    if (!nextCursor) {
      break;
    }

    cursor = nextCursor;
  }

  return rows;
};

const loadRuns = (nk: RuntimeNakama, filters: AnalyticsFilters): TournamentRunRecord[] => {
  const runIds = readRunIndexState(nk).index.runIds;
  return readRunsByIds(nk, runIds)
    .filter((run) => runMatchesFilters(run, filters))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
};

const readTournamentMatchResultIds = (run: TournamentRunRecord): string[] =>
  unique(readStringArrayField(run.metadata, ["countedResultIds", "counted_result_ids"]));

const buildTournamentEntryContextByMatchId = (runs: TournamentRunRecord[]): Map<string, TournamentEntryContext> => {
  const contextByMatchId = new Map<string, TournamentEntryContext>();

  runs.forEach((run) => {
    run.bracket?.entries.forEach((entry) => {
      if (!entry.matchId) {
        return;
      }

      const startedAtMs = parseIsoMs(entry.startedAt);
      const completedAtMs = parseIsoMs(entry.completedAt);
      contextByMatchId.set(entry.matchId, {
        runId: run.runId,
        tournamentId: run.tournamentId,
        round: entry.round,
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
        durationSeconds:
          startedAtMs !== null && completedAtMs !== null && completedAtMs >= startedAtMs
            ? Math.round((completedAtMs - startedAtMs) / 1000)
            : null,
      });
    });
  });

  return contextByMatchId;
};

const loadTournamentMatchHistory = (nk: RuntimeNakama, runs: TournamentRunRecord[]): HistoricalMatchRecord[] => {
  const resultIds = unique(runs.flatMap((run) => readTournamentMatchResultIds(run)));
  if (resultIds.length === 0) {
    return [];
  }

  const objects = nk.storageRead(
    resultIds.map((resultId) => ({
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION,
      key: resultId,
    })),
  ) as Array<{ collection?: string; key?: string; value?: unknown }>;
  const objectByKey = new Map(
    objects
      .map((object) => {
        const key = readStringField(object, ["key"]);
        return key ? ([key, object] as const) : null;
      })
      .filter((entry): entry is readonly [string, { value?: unknown }] => Boolean(entry)),
  );
  const entryContextByMatchId = buildTournamentEntryContextByMatchId(runs);

  return resultIds
    .map((resultId) => normalizeTournamentMatchResult(objectByKey.get(resultId)?.value ?? null))
    .filter((record): record is TournamentMatchResultRecord => Boolean(record))
    .map((record) => {
      const summary = asRecord(record.summary);
      const classificationRecord = asRecord(summary?.classification);
      const entryContext = entryContextByMatchId.get(record.matchId) ?? null;
      const players = Array.isArray(summary?.players)
        ? summary.players
            .map((player) => {
              const normalized = asRecord(player);
              const userId = readStringField(normalized, ["userId", "user_id"]);
              if (!normalized || !userId) {
                return null;
              }

              return {
                userId,
                username: readStringField(normalized, ["username"]),
                color: (() => {
                  const color = readStringField(normalized, ["color"]);
                  return color === "light" || color === "dark" ? color : null;
                })(),
                didWin: readBooleanField(normalized, ["didWin", "did_win"]),
                capturesMade: readNumberField(normalized, ["capturesMade", "captures_made"]),
                capturesSuffered: readNumberField(normalized, ["capturesSuffered", "captures_suffered"]),
                playerMoveCount: readNumberField(normalized, ["playerMoveCount", "player_move_count"]),
                finishedCount: readNumberField(normalized, ["finishedCount", "finished_count"]),
                isBot: isTournamentBotUserId(userId),
              } satisfies HistoricalMatchPlayer;
            })
            .filter((player): player is HistoricalMatchPlayer => Boolean(player))
        : [];

      return {
        source: "tournament",
        matchId: record.matchId,
        startedAt: entryContext?.startedAt ?? null,
        endedAt:
          readStringField(summary, ["completedAt", "completed_at"]) ??
          entryContext?.completedAt ??
          record.updatedAt,
        durationSeconds: entryContext?.durationSeconds ?? null,
        reason: "completed",
        modeId: readStringField(summary, ["modeId", "mode_id"]) ?? getRunGameMode(runs.find((run) => run.runId === record.runId) ?? runs[0]),
        classification: {
          ranked: readBooleanField(classificationRecord, ["ranked"]) === true,
          casual: readBooleanField(classificationRecord, ["casual"]) === true,
          private: readBooleanField(classificationRecord, ["private"]) === true,
          bot: readBooleanField(classificationRecord, ["bot"]) === true,
          experimental: readBooleanField(classificationRecord, ["experimental"]) === true,
          tournament: true,
        },
        tournamentRunId: record.runId,
        tournamentId: record.tournamentId,
        winnerUserId: readStringField(summary, ["winnerUserId", "winner_user_id"]),
        loserUserId: readStringField(summary, ["loserUserId", "loser_user_id"]),
        totalMoves: readNumberField(summary, ["totalMoves", "total_moves"]),
        totalTurns: null,
        players,
      } satisfies HistoricalMatchRecord;
    });
};

const loadTrackedAnalyticsEvents = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
): {
  supported: boolean;
  notes: string[];
  trackedMatchStarts: MatchStartAnalyticsEvent[];
  trackedMatchEnds: MatchEndAnalyticsEvent[];
  xpAwardEvents: XpAwardAnalyticsEvent[];
} => {
  const result = listAnalyticsEvents(nk, logger);

  return {
    supported: result.supported,
    notes: result.notes,
    trackedMatchStarts: result.events.filter(
      (event): event is MatchStartAnalyticsEvent => event.type === "match_start",
    ),
    trackedMatchEnds: result.events.filter(
      (event): event is MatchEndAnalyticsEvent => event.type === "match_end",
    ),
    xpAwardEvents: result.events.filter((event): event is XpAwardAnalyticsEvent => event.type === "xp_awarded"),
  };
};

const buildTrackedMatchHistory = (trackedMatchEnds: MatchEndAnalyticsEvent[], filters: AnalyticsFilters): HistoricalMatchRecord[] =>
  trackedMatchEnds
    .filter((event) => {
      if (filters.gameMode && filters.gameMode !== event.modeId) {
        return false;
      }

      if (
        filters.tournamentId &&
        filters.tournamentId !== event.tournamentRunId &&
        filters.tournamentId !== event.tournamentId
      ) {
        return false;
      }

      return true;
    })
    .map((event) => ({
      source: "tracked",
      matchId: event.matchId,
      startedAt: event.startedAt,
      endedAt: event.endedAt,
      durationSeconds: event.durationSeconds,
      reason: event.reason,
      modeId: event.modeId,
      classification: event.classification,
      tournamentRunId: event.tournamentRunId,
      tournamentId: event.tournamentId,
      winnerUserId: event.winnerUserId,
      loserUserId: event.loserUserId,
      totalMoves: event.totalMoves,
      totalTurns: event.totalTurns,
      players: event.players.map((player) => ({
        userId: player.userId,
        username: player.username,
        color: player.color,
        didWin: player.didWin,
        capturesMade: player.capturesMade,
        capturesSuffered: player.capturesSuffered,
        playerMoveCount: player.playerMoveCount,
        finishedCount: player.finishedCount,
        isBot: player.isBot,
      })),
    }));

const loadEloHistory = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  filters: AnalyticsFilters,
): {
  supported: boolean;
  notes: string[];
  leaderboardRows: EloLeaderboardRow[];
  eloHistory: EloHistoryRecord[];
  eloMatches: HistoricalMatchRecord[];
} => {
  const leaderboardRows = listAllLeaderboardRows(nk);
  const historyResult = listAllGlobalObjects(nk, logger, "elo_match_results", "00000000-0000-0000-0000-000000000000");
  const eloHistory = historyResult.objects
    .map((object) => normalizeEloHistoryRecord(object.value ?? null))
    .filter((record): record is EloHistoryRecord => Boolean(record));

  const eloMatches = eloHistory
    .filter((record) => {
      if (filters.gameMode && filters.gameMode !== "standard") {
        return false;
      }

      return true;
    })
    .map((record) => ({
      source: "elo",
      matchId: record.matchId,
      startedAt: null,
      endedAt: record.processedAt,
      durationSeconds: null,
      reason: "completed",
      modeId: "standard",
      classification: {
        ranked: true,
        casual: false,
        private: false,
        bot: false,
        experimental: false,
        tournament: false,
      },
      tournamentRunId: null,
      tournamentId: null,
      winnerUserId: record.winnerUserId,
      loserUserId: record.loserUserId,
      totalMoves: null,
      totalTurns: null,
      players: record.playerResults.map((player) => ({
        userId: player.userId,
        username: player.usernameDisplay,
        color: null,
        didWin: player.userId === record.winnerUserId,
        capturesMade: null,
        capturesSuffered: null,
        playerMoveCount: null,
        finishedCount: null,
        isBot: false,
      })),
    } satisfies HistoricalMatchRecord));

  return {
    supported: historyResult.supported,
    notes: historyResult.notes,
    leaderboardRows,
    eloHistory,
    eloMatches,
  };
};

const loadKnownUsers = (
  nk: RuntimeNakama,
  userIds: string[],
  leaderboardRows: EloLeaderboardRow[],
): Map<string, KnownUserRecord> => {
  const leaderboardByUserId = new Map(leaderboardRows.map((row) => [row.userId, row] as const));
  const records = new Map<string, KnownUserRecord>();
  const uniqueUserIds = unique(userIds.filter((userId) => isHumanUserId(userId)));

  batch(uniqueUserIds, 60).forEach((chunk) => {
    const requests = chunk.flatMap((userId) => [
      {
        collection: USERNAME_PROFILE_COLLECTION,
        key: USERNAME_PROFILE_KEY,
        userId,
      },
      {
        collection: PROGRESSION_COLLECTION,
        key: PROGRESSION_PROFILE_KEY,
        userId,
      },
    ]);
    const objects = nk.storageRead(requests) as Array<{
      collection?: string;
      key?: string;
      userId?: string;
      value?: unknown;
    }>;

    const objectMap = new Map(
      objects
        .map((object) => {
          const collection = readStringField(object, ["collection"]);
          const key = readStringField(object, ["key"]);
          const userId = readStringField(object, ["userId", "user_id"]);
          return collection && key && userId ? ([`${collection}:${key}:${userId}`, object] as const) : null;
        })
        .filter((entry): entry is readonly [string, { value?: unknown }] => Boolean(entry)),
    );

    chunk.forEach((userId) => {
      const usernameProfile = asRecord(
        objectMap.get(`${USERNAME_PROFILE_COLLECTION}:${USERNAME_PROFILE_KEY}:${userId}`)?.value ?? null,
      );
      const progressionProfile = asRecord(
        objectMap.get(`${PROGRESSION_COLLECTION}:${PROGRESSION_PROFILE_KEY}:${userId}`)?.value ?? null,
      );
      const leaderboardRow = leaderboardByUserId.get(userId) ?? null;

      records.set(userId, {
        userId,
        username:
          readStringField(usernameProfile, ["usernameDisplay", "username_display"]) ??
          leaderboardRow?.usernameDisplay ??
          userId,
        createdAt: readStringField(usernameProfile, ["createdAt", "created_at"]),
        totalXp: readNumberField(progressionProfile, ["totalXp", "total_xp"]),
        currentRankTitle: readStringField(progressionProfile, ["currentRankTitle", "current_rank_title"]),
        eloRating: leaderboardRow?.eloRating ?? null,
        ratedGames: leaderboardRow?.ratedGames ?? null,
        ratedWins: leaderboardRow?.ratedWins ?? null,
        ratedLosses: leaderboardRow?.ratedLosses ?? null,
      });
    });
  });

  return records;
};

const buildUnifiedMatches = (
  trackedMatches: HistoricalMatchRecord[],
  tournamentMatches: HistoricalMatchRecord[],
  eloMatches: HistoricalMatchRecord[],
): HistoricalMatchRecord[] => {
  const matchById = new Map<string, HistoricalMatchRecord>();

  tournamentMatches.forEach((match) => {
    matchById.set(match.matchId, match);
  });

  eloMatches.forEach((match) => {
    if (!matchById.has(match.matchId)) {
      matchById.set(match.matchId, match);
    }
  });

  trackedMatches.forEach((match) => {
    matchById.set(match.matchId, match);
  });

  return Array.from(matchById.values()).sort((left, right) => left.endedAt.localeCompare(right.endedAt));
};

const collectActivityEvents = (
  runs: TournamentRunRecord[],
  trackedMatchStarts: MatchStartAnalyticsEvent[],
  trackedMatchEnds: MatchEndAnalyticsEvent[],
  tournamentMatches: HistoricalMatchRecord[],
  eloMatches: HistoricalMatchRecord[],
  xpAwardEvents: XpAwardAnalyticsEvent[],
): Array<{ userId: string; occurredAt: string; source: string }> => {
  const events: Array<{ userId: string; occurredAt: string; source: string }> = [];

  runs.forEach((run) => {
    run.registrations.forEach((registration) => {
      if (!isHumanUserId(registration.userId)) {
        return;
      }

      events.push({
        userId: registration.userId,
        occurredAt: registration.joinedAt,
        source: "tournament_registration",
      });
    });
  });

  trackedMatchStarts.forEach((event) => {
    event.players.forEach((player) => {
      if (!isHumanUserId(player.userId)) {
        return;
      }

      events.push({
        userId: player.userId,
        occurredAt: event.startedAt,
        source: "match_start",
      });
    });
  });

  trackedMatchEnds.forEach((event) => {
    event.players.forEach((player) => {
      if (!isHumanUserId(player.userId)) {
        return;
      }

      events.push({
        userId: player.userId,
        occurredAt: event.endedAt,
        source: "match_end",
      });
    });
  });

  tournamentMatches.forEach((match) => {
    match.players.forEach((player) => {
      if (!isHumanUserId(player.userId)) {
        return;
      }

      events.push({
        userId: player.userId,
        occurredAt: match.endedAt,
        source: "tournament_match",
      });
    });
  });

  eloMatches.forEach((match) => {
    match.players.forEach((player) => {
      if (!isHumanUserId(player.userId)) {
        return;
      }

      events.push({
        userId: player.userId,
        occurredAt: match.endedAt,
        source: "ranked_match",
      });
    });
  });

  xpAwardEvents.forEach((event) => {
    if (!isHumanUserId(event.userId)) {
      return;
    }

    events.push({
      userId: event.userId,
      occurredAt: event.occurredAt,
      source: "xp_award",
    });
  });

  return events.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
};

const buildFirstSeenByUserId = (
  usersById: Map<string, KnownUserRecord>,
  activityEvents: Array<{ userId: string; occurredAt: string; source: string }>,
): Map<string, string> => {
  const firstSeenByUserId = new Map<string, string>();

  usersById.forEach((user) => {
    if (user.createdAt) {
      firstSeenByUserId.set(user.userId, user.createdAt);
    }
  });

  activityEvents.forEach((event) => {
    const current = firstSeenByUserId.get(event.userId);
    if (!current || event.occurredAt < current) {
      firstSeenByUserId.set(event.userId, event.occurredAt);
    }
  });

  return firstSeenByUserId;
};

const buildUserPerformance = (
  usersById: Map<string, KnownUserRecord>,
  unifiedMatches: HistoricalMatchRecord[],
  runs: TournamentRunRecord[],
  firstSeenByUserId: Map<string, string>,
): Map<string, UserPerformance> => {
  const participationByUserId = new Map<string, number>();
  const performanceByUserId = new Map<string, UserPerformance>();

  runs.forEach((run) => {
    run.registrations.forEach((registration) => {
      if (!isHumanUserId(registration.userId)) {
        return;
      }

      participationByUserId.set(
        registration.userId,
        (participationByUserId.get(registration.userId) ?? 0) + 1,
      );
    });
  });

  unifiedMatches.forEach((match) => {
    match.players.forEach((player) => {
      if (!isHumanUserId(player.userId)) {
        return;
      }

      const current = performanceByUserId.get(player.userId) ?? {
        userId: player.userId,
        username: usersById.get(player.userId)?.username ?? player.username ?? player.userId,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        tournamentParticipations: participationByUserId.get(player.userId) ?? 0,
        lastActiveAt: null,
        firstSeenAt: firstSeenByUserId.get(player.userId) ?? null,
      };

      current.matchesPlayed += 1;
      current.wins += player.didWin === true ? 1 : 0;
      current.losses += player.didWin === false ? 1 : 0;
      current.lastActiveAt =
        current.lastActiveAt && current.lastActiveAt > match.endedAt ? current.lastActiveAt : match.endedAt;
      performanceByUserId.set(player.userId, current);
    });
  });

  usersById.forEach((user) => {
    if (!performanceByUserId.has(user.userId)) {
      performanceByUserId.set(user.userId, {
        userId: user.userId,
        username: user.username,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        tournamentParticipations: participationByUserId.get(user.userId) ?? 0,
        lastActiveAt: null,
        firstSeenAt: firstSeenByUserId.get(user.userId) ?? null,
      });
    }
  });

  return performanceByUserId;
};

const createAnalyticsContext = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  filters: AnalyticsFilters,
): AnalyticsContext => {
  const generatedAt = new Date().toISOString();
  const runs = loadRuns(nk, filters);
  const tournamentMatches = loadTournamentMatchHistory(nk, runs);
  const trackedResult = loadTrackedAnalyticsEvents(nk, logger);
  const trackedMatches = buildTrackedMatchHistory(trackedResult.trackedMatchEnds, filters);
  const eloResult = loadEloHistory(nk, logger, filters);
  const unifiedMatches = buildUnifiedMatches(trackedMatches, tournamentMatches, eloResult.eloMatches);
  const userIds = unique(
    [
      ...runs.flatMap((run) => run.registrations.map((registration) => registration.userId)),
      ...trackedResult.trackedMatchStarts.flatMap((event) => event.players.map((player) => player.userId)),
      ...trackedResult.trackedMatchEnds.flatMap((event) => event.players.map((player) => player.userId)),
      ...tournamentMatches.flatMap((match) => match.players.map((player) => player.userId)),
      ...eloResult.eloMatches.flatMap((match) => match.players.map((player) => player.userId)),
      ...eloResult.leaderboardRows.map((row) => row.userId),
      ...trackedResult.xpAwardEvents.map((event) => event.userId),
    ].filter((userId): userId is string => isHumanUserId(userId)),
  );
  const usersById = loadKnownUsers(nk, userIds, eloResult.leaderboardRows);
  const activityEvents = collectActivityEvents(
    runs,
    trackedResult.trackedMatchStarts,
    trackedResult.trackedMatchEnds,
    tournamentMatches,
    eloResult.eloMatches,
    trackedResult.xpAwardEvents,
  );
  const firstSeenByUserId = buildFirstSeenByUserId(usersById, activityEvents);
  const userPerformanceById = buildUserPerformance(usersById, unifiedMatches, runs, firstSeenByUserId);

  return {
    generatedAt,
    filters,
    runs,
    tournamentMatches,
    trackedMatches,
    eloMatches: eloResult.eloMatches,
    unifiedMatches,
    trackedMatchStarts: trackedResult.trackedMatchStarts.filter((event) => {
      if (filters.gameMode && filters.gameMode !== event.modeId) {
        return false;
      }

      if (
        filters.tournamentId &&
        filters.tournamentId !== event.tournamentRunId &&
        filters.tournamentId !== event.tournamentId
      ) {
        return false;
      }

      return true;
    }),
    trackedMatchEnds: trackedResult.trackedMatchEnds,
    xpAwardEvents: trackedResult.xpAwardEvents,
    activityEvents,
    usersById,
    userPerformanceById,
    firstSeenByUserId,
    leaderboardRows: eloResult.leaderboardRows,
    eloHistory: eloResult.eloHistory,
    eventsSupported: trackedResult.supported,
    eloHistorySupported: eloResult.supported,
    runtimeNotes: [...trackedResult.notes, ...eloResult.notes],
  };
};

const filterEndedMatchesInWindow = (
  matches: HistoricalMatchRecord[],
  startMs: number,
  endMs: number,
): HistoricalMatchRecord[] =>
  matches.filter((match) => {
    const endedAtMs = parseIsoMs(match.endedAt);
    return endedAtMs !== null && endedAtMs >= startMs && endedAtMs <= endMs;
  });

const filterStartsInWindow = (
  context: AnalyticsContext,
  startMs: number,
  endMs: number,
): Array<{
  matchId: string;
  startedAt: string;
  modeId: string | null;
  tournamentRunId: string | null;
  tournamentId: string | null;
}> => {
  const startsById = new Map<
    string,
    { matchId: string; startedAt: string; modeId: string | null; tournamentRunId: string | null; tournamentId: string | null }
  >();

  context.trackedMatchStarts.forEach((event) => {
    const startedAtMs = parseIsoMs(event.startedAt);
    if (startedAtMs === null || startedAtMs < startMs || startedAtMs > endMs) {
      return;
    }

    startsById.set(event.matchId, {
      matchId: event.matchId,
      startedAt: event.startedAt,
      modeId: event.modeId,
      tournamentRunId: event.tournamentRunId,
      tournamentId: event.tournamentId,
    });
  });

  context.runs.forEach((run) => {
    run.bracket?.entries.forEach((entry) => {
      if (!entry.matchId || !entry.startedAt) {
        return;
      }

      const startedAtMs = parseIsoMs(entry.startedAt);
      if (startedAtMs === null || startedAtMs < startMs || startedAtMs > endMs) {
        return;
      }

      startsById.set(entry.matchId, {
        matchId: entry.matchId,
        startedAt: entry.startedAt,
        modeId: getRunGameMode(run),
        tournamentRunId: run.runId,
        tournamentId: run.tournamentId,
      });
    });
  });

  return Array.from(startsById.values());
};

const buildStartedMatchMetrics = (
  context: AnalyticsContext,
  startMs: number,
  endMs: number,
): {
  startedCount: number;
  completedCount: number;
  disconnectCount: number;
  inactivityCount: number;
  abandonedCount: number;
} => {
  const starts = filterStartsInWindow(context, startMs, endMs);
  const matchById = new Map(context.unifiedMatches.map((match) => [match.matchId, match] as const));
  let completedCount = 0;
  let disconnectCount = 0;
  let inactivityCount = 0;

  starts.forEach((start) => {
    const matched = matchById.get(start.matchId) ?? null;
    if (!matched) {
      return;
    }

    if (matched.reason === "completed") {
      completedCount += 1;
      return;
    }

    if (matched.reason === "forfeit_disconnect") {
      disconnectCount += 1;
      return;
    }

    if (matched.reason === "forfeit_inactivity") {
      inactivityCount += 1;
    }
  });

  const abandonedCount = Math.max(0, starts.length - completedCount - disconnectCount - inactivityCount);

  return {
    startedCount: starts.length,
    completedCount,
    disconnectCount,
    inactivityCount,
    abandonedCount,
  };
};

const countUniqueActiveUsers = (
  activityEvents: Array<{ userId: string; occurredAt: string; source: string }>,
  startMs: number,
  endMs: number,
): number =>
  new Set(
    activityEvents
      .filter((event) => {
        const occurredAtMs = parseIsoMs(event.occurredAt);
        return occurredAtMs !== null && occurredAtMs >= startMs && occurredAtMs <= endMs;
      })
      .map((event) => event.userId),
  ).size;

const buildDailyActiveUserCounts = (
  activityEvents: Array<{ userId: string; occurredAt: string; source: string }>,
  filters: AnalyticsFilters,
): Map<string, Set<string>> => {
  const activityByDay = new Map<string, Set<string>>();

  buildDayKeys(filters).forEach((dayKey) => {
    activityByDay.set(dayKey, new Set());
  });

  activityEvents.forEach((event) => {
    if (!isWithinRange(event.occurredAt, filters)) {
      return;
    }

    const dayKey = toDayKey(event.occurredAt);
    if (!activityByDay.has(dayKey)) {
      activityByDay.set(dayKey, new Set());
    }
    activityByDay.get(dayKey)?.add(event.userId);
  });

  return activityByDay;
};

const buildCountPoints = (valuesByDay: Map<string, number>, filters: AnalyticsFilters): CountPoint[] =>
  buildDayKeys(filters).map((dayKey) => ({
    date: dayKey,
    value: valuesByDay.get(dayKey) ?? 0,
  }));

const buildRatePoints = (
  numeratorByDay: Map<string, number>,
  denominatorByDay: Map<string, number>,
  filters: AnalyticsFilters,
): RatePoint[] =>
  buildDayKeys(filters).map((dayKey) => {
    const numerator = numeratorByDay.get(dayKey) ?? 0;
    const denominator = denominatorByDay.get(dayKey) ?? 0;

    return {
      date: dayKey,
      value: toPercentage(numerator, denominator),
      numerator,
      denominator,
    };
  });

const buildDualCountPoints = (
  primaryByDay: Map<string, number>,
  secondaryByDay: Map<string, number>,
  filters: AnalyticsFilters,
): DualCountPoint[] =>
  buildDayKeys(filters).map((dayKey) => {
    const primary = primaryByDay.get(dayKey) ?? 0;
    const secondary = secondaryByDay.get(dayKey) ?? 0;

    return {
      date: dayKey,
      primary,
      secondary,
      total: primary + secondary,
    };
  });

const buildBucketDistribution = (
  values: number[],
  bucketConfig: Array<{ key: string; label: string; min: number; max: number | null }>,
): DistributionBucket[] =>
  bucketConfig.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    min: Number.isFinite(bucket.min) ? bucket.min : null,
    max: bucket.max,
    count: values.filter((value) => value >= bucket.min && (bucket.max === null || value < bucket.max)).length,
  }));

const buildSummaryData = (context: AnalyticsContext): AnalyticsSummaryData => {
  const previousWindowDuration = context.filters.endMs - context.filters.startMs;
  const previousStartMs = context.filters.startMs - previousWindowDuration - 1;
  const previousEndMs = context.filters.startMs - 1;
  const endDayStartMs = startOfDayMs(context.filters.endMs);
  const wauWindowStartMs = context.filters.endMs - 6 * DAY_BUCKET_MS;
  const previousDayStartMs = endDayStartMs - DAY_BUCKET_MS;
  const previousWauWindowEndMs = wauWindowStartMs - 1;
  const previousWauWindowStartMs = previousWauWindowEndMs - 6 * DAY_BUCKET_MS;

  const dauCurrent = countUniqueActiveUsers(context.activityEvents, endDayStartMs, endDayStartMs + DAY_BUCKET_MS - 1);
  const dauPrevious = countUniqueActiveUsers(
    context.activityEvents,
    previousDayStartMs,
    previousDayStartMs + DAY_BUCKET_MS - 1,
  );
  const wauCurrent = countUniqueActiveUsers(context.activityEvents, wauWindowStartMs, context.filters.endMs);
  const wauPrevious = countUniqueActiveUsers(
    context.activityEvents,
    previousWauWindowStartMs,
    previousWauWindowEndMs,
  );
  const matchesInWindow = filterEndedMatchesInWindow(
    context.unifiedMatches,
    context.filters.startMs,
    context.filters.endMs,
  );
  const previousMatchesInWindow = filterEndedMatchesInWindow(
    context.unifiedMatches,
    previousStartMs,
    previousEndMs,
  );
  const completionWindow = buildStartedMatchMetrics(context, context.filters.startMs, context.filters.endMs);
  const previousCompletionWindow = buildStartedMatchMetrics(context, previousStartMs, previousEndMs);
  const durationValues = matchesInWindow
    .map((match) => match.durationSeconds)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const previousDurationValues = previousMatchesInWindow
    .map((match) => match.durationSeconds)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const tournamentsCompletedCount = context.runs.filter((run) => isWithinRange(run.finalizedAt, context.filters)).length;
  const previousTournamentsCompletedCount = context.runs.filter((run) => {
    const finalizedAtMs = parseIsoMs(run.finalizedAt);
    return finalizedAtMs !== null && finalizedAtMs >= previousStartMs && finalizedAtMs <= previousEndMs;
  }).length;
  const activeTournamentsCount = context.runs.filter(
    (run) => run.lifecycle === "open" || (run.lifecycle === "closed" && !run.finalizedAt),
  ).length;
  const onlinePresence = getOnlinePresenceSnapshot();
  const disconnectsInRange = matchesInWindow.filter(
    (match) => match.reason === "forfeit_disconnect" || match.reason === "forfeit_inactivity",
  ).length;
  const previousDisconnectsInRange = previousMatchesInWindow.filter(
    (match) => match.reason === "forfeit_disconnect" || match.reason === "forfeit_inactivity",
  ).length;
  const completionAvailability =
    completionWindow.startedCount === 0
      ? context.eventsSupported
        ? noData("No started matches were recorded in this date range.")
        : partial(["Cross-mode start tracking is not available on this runtime."])
      : completionWindow.startedCount < 3
        ? notEnoughData("Not enough started matches yet for a stable completion rate.", completionWindow.startedCount)
        : available(completionWindow.startedCount);

  return {
    dau: createMetric(
      dauCurrent,
      context.activityEvents.length > 0
        ? available(dauCurrent)
        : noData("No recorded player activity is available yet."),
      { previousValue: dauPrevious },
    ),
    wau: createMetric(
      wauCurrent,
      context.activityEvents.length > 0
        ? available(wauCurrent)
        : noData("No recorded player activity is available yet."),
      { previousValue: wauPrevious },
    ),
    matchesPlayed: createMetric(
      matchesInWindow.length,
      matchesInWindow.length > 0 ? available(matchesInWindow.length) : noData("No matches ended in this date range."),
      { previousValue: previousMatchesInWindow.length },
    ),
    completionRate: createMetric(
      toPercentage(completionWindow.completedCount, completionWindow.startedCount),
      completionAvailability,
      {
        numerator: completionWindow.completedCount,
        denominator: completionWindow.startedCount,
        previousValue: toPercentage(previousCompletionWindow.completedCount, previousCompletionWindow.startedCount),
      },
    ),
    medianMatchDurationSeconds: createMetric(
      median(durationValues),
      durationValues.length === 0
        ? noData("No completed matches with duration data are available in this date range.")
        : durationValues.length < 3
          ? notEnoughData("Not enough completed matches yet to show a reliable duration median.", durationValues.length)
          : available(durationValues.length),
      { previousValue: median(previousDurationValues) },
    ),
    activeTournaments: createMetric(activeTournamentsCount, available(activeTournamentsCount)),
    tournamentsCompleted: createMetric(
      tournamentsCompletedCount,
      tournamentsCompletedCount > 0
        ? available(tournamentsCompletedCount)
        : noData("No tournaments finalized in this date range."),
      { previousValue: previousTournamentsCompletedCount },
    ),
    currentOnlinePlayers: createMetric(onlinePresence.onlineCount, available(onlinePresence.onlineCount)),
    disconnectRate: createMetric(
      toPercentage(disconnectsInRange, matchesInWindow.length),
      matchesInWindow.length === 0
        ? noData("No ended matches are available for disconnect-rate reporting in this range.")
        : matchesInWindow.length < 3
          ? notEnoughData("Not enough ended matches yet for a stable disconnect rate.", matchesInWindow.length)
          : available(matchesInWindow.length),
      {
        numerator: disconnectsInRange,
        denominator: matchesInWindow.length,
        previousValue: toPercentage(previousDisconnectsInRange, previousMatchesInWindow.length),
      },
    ),
  };
};

const buildOverviewData = (context: AnalyticsContext): AnalyticsOverviewData => {
  const activityByDay = buildDailyActiveUserCounts(context.activityEvents, context.filters);
  const dauValues = new Map<string, number>(
    Array.from(activityByDay.entries()).map(([dayKey, users]) => [dayKey, users.size] as const),
  );
  const wauValues = new Map<string, number>();
  const matchesByDay = new Map<string, number>();
  const completedStartsByDay = new Map<string, number>();
  const startsByDay = new Map<string, number>();
  const createdByDay = new Map<string, number>();
  const completedTournamentByDay = new Map<string, number>();
  const firstSeenByDay = new Map<string, number>();
  const returningByDay = new Map<string, number>();
  const allDayKeys = buildDayKeys(context.filters);

  context.unifiedMatches.forEach((match) => {
    if (!isWithinRange(match.endedAt, context.filters)) {
      return;
    }

    const dayKey = toDayKey(match.endedAt);
    matchesByDay.set(dayKey, (matchesByDay.get(dayKey) ?? 0) + 1);
  });

  const startedMetrics = filterStartsInWindow(context, context.filters.startMs, context.filters.endMs);
  const matchById = new Map(context.unifiedMatches.map((match) => [match.matchId, match] as const));
  startedMetrics.forEach((started) => {
    const dayKey = toDayKey(started.startedAt);
    startsByDay.set(dayKey, (startsByDay.get(dayKey) ?? 0) + 1);
    const matched = matchById.get(started.matchId);
    if (matched?.reason === "completed") {
      completedStartsByDay.set(dayKey, (completedStartsByDay.get(dayKey) ?? 0) + 1);
    }
  });

  allDayKeys.forEach((dayKey) => {
    const currentDayMs = parseIsoMs(`${dayKey}T00:00:00.000Z`) ?? context.filters.startMs;
    const trailingUserIds = new Set<string>();
    context.activityEvents.forEach((event) => {
      const occurredAtMs = parseIsoMs(event.occurredAt);
      if (
        occurredAtMs !== null &&
        occurredAtMs >= currentDayMs - 6 * DAY_BUCKET_MS &&
        occurredAtMs <= currentDayMs + DAY_BUCKET_MS - 1
      ) {
        trailingUserIds.add(event.userId);
      }
    });
    wauValues.set(dayKey, trailingUserIds.size);
  });

  context.runs.forEach((run) => {
    if (isWithinRange(run.createdAt, context.filters)) {
      const dayKey = toDayKey(run.createdAt);
      createdByDay.set(dayKey, (createdByDay.get(dayKey) ?? 0) + 1);
    }

    if (isWithinRange(run.finalizedAt, context.filters)) {
      const dayKey = toDayKey(run.finalizedAt as string);
      completedTournamentByDay.set(dayKey, (completedTournamentByDay.get(dayKey) ?? 0) + 1);
    }
  });

  context.firstSeenByUserId.forEach((firstSeenAt) => {
    if (!isWithinRange(firstSeenAt, context.filters)) {
      return;
    }

    const dayKey = toDayKey(firstSeenAt);
    firstSeenByDay.set(dayKey, (firstSeenByDay.get(dayKey) ?? 0) + 1);
  });

  activityByDay.forEach((userIds, dayKey) => {
    let returning = 0;
    userIds.forEach((userId) => {
      const firstSeenAt = context.firstSeenByUserId.get(userId);
      if (!firstSeenAt) {
        return;
      }

      if (toDayKey(firstSeenAt) < dayKey) {
        returning += 1;
      }
    });
    returningByDay.set(dayKey, returning);
  });

  const dauPoints = buildCountPoints(dauValues, context.filters);
  const wauPoints = buildCountPoints(wauValues, context.filters);
  const matchPoints = buildCountPoints(matchesByDay, context.filters);
  const completionPoints = buildRatePoints(completedStartsByDay, startsByDay, context.filters);
  const newVsReturningPoints = buildDualCountPoints(firstSeenByDay, returningByDay, context.filters);
  const totalPlayersCount = countUniqueActiveUsers(
    context.activityEvents,
    context.filters.startMs,
    context.filters.endMs,
  );

  return {
    dauTrend: {
      availability: context.activityEvents.length > 0 ? available(context.activityEvents.length) : noData("No recorded player activity is available yet."),
      points: dauPoints,
    },
    wauTrend: {
      availability: context.activityEvents.length > 0 ? available(context.activityEvents.length) : noData("No recorded player activity is available yet."),
      points: wauPoints,
    },
    matchesPerDay: {
      availability: matchPoints.some((point) => point.value > 0)
        ? available(matchPoints.reduce((sum, point) => sum + point.value, 0))
        : noData("No matches ended in this date range."),
      points: matchPoints,
    },
    completionRateTrend: {
      availability: completionPoints.some((point) => point.denominator > 0)
        ? available(completionPoints.reduce((sum, point) => sum + point.denominator, 0))
        : context.eventsSupported
          ? noData("No started matches were recorded in this date range.")
          : partial(["Cross-mode start tracking is not available on this runtime."]),
      points: completionPoints,
    },
    newVsReturningPlayers: {
      availability: newVsReturningPoints.some((point) => point.total > 0)
        ? available(newVsReturningPoints.reduce((sum, point) => sum + point.total, 0))
        : noData("No player activity or first-seen data is available in this date range."),
      points: newVsReturningPoints,
    },
    totalPlayers: createMetric(
      totalPlayersCount,
      totalPlayersCount > 0 ? available(totalPlayersCount) : noData("No active players were recorded in this date range."),
    ),
    tournamentsCreated: createMetric(
      context.runs.filter((run) => isWithinRange(run.createdAt, context.filters)).length,
      context.runs.length > 0 ? available(context.runs.length) : noData("No tournaments match the selected filters."),
    ),
    tournamentsCompleted: createMetric(
      context.runs.filter((run) => isWithinRange(run.finalizedAt, context.filters)).length,
      context.runs.some((run) => Boolean(run.finalizedAt))
        ? available(context.runs.filter((run) => Boolean(run.finalizedAt)).length)
        : noData("No finalized tournaments are available in the selected filters."),
    ),
  };
};

const buildPlayersData = (context: AnalyticsContext): AnalyticsPlayersData => {
  const newPlayersByDay = new Map<string, number>();
  const returningPlayersByDay = new Map<string, number>();
  const activityDaysByUser = new Map<string, Set<string>>();
  const retentionEligible = {
    d1: [] as string[],
    d7: [] as string[],
    d30: [] as string[],
  };
  const retentionReturned = {
    d1: 0,
    d7: 0,
    d30: 0,
  };

  context.firstSeenByUserId.forEach((firstSeenAt, userId) => {
    if (!isWithinRange(firstSeenAt, context.filters)) {
      return;
    }

    const dayKey = toDayKey(firstSeenAt);
    newPlayersByDay.set(dayKey, (newPlayersByDay.get(dayKey) ?? 0) + 1);

    const firstSeenMs = parseIsoMs(firstSeenAt);
    if (firstSeenMs === null) {
      return;
    }

    if (firstSeenMs + DAY_BUCKET_MS <= context.filters.endMs) {
      retentionEligible.d1.push(userId);
    }

    if (firstSeenMs + 7 * DAY_BUCKET_MS <= context.filters.endMs) {
      retentionEligible.d7.push(userId);
    }

    if (firstSeenMs + 30 * DAY_BUCKET_MS <= context.filters.endMs) {
      retentionEligible.d30.push(userId);
    }
  });

  context.activityEvents.forEach((event) => {
    if (!isWithinRange(event.occurredAt, context.filters)) {
      return;
    }

    const dayKey = toDayKey(event.occurredAt);
    if (!activityDaysByUser.has(event.userId)) {
      activityDaysByUser.set(event.userId, new Set());
    }
    activityDaysByUser.get(event.userId)?.add(dayKey);

    const firstSeenAt = context.firstSeenByUserId.get(event.userId);
    if (!firstSeenAt) {
      return;
    }

    if (toDayKey(firstSeenAt) < dayKey) {
      returningPlayersByDay.set(dayKey, (returningPlayersByDay.get(dayKey) ?? 0) + 1);
    }
  });

  const didReturnOnTargetDay = (userId: string, offsetDays: number): boolean => {
    const firstSeenAt = context.firstSeenByUserId.get(userId);
    if (!firstSeenAt) {
      return false;
    }

    const targetKey = toDayKey((parseIsoMs(firstSeenAt) ?? 0) + offsetDays * DAY_BUCKET_MS);
    return activityDaysByUser.get(userId)?.has(targetKey) === true;
  };

  retentionEligible.d1.forEach((userId) => {
    if (didReturnOnTargetDay(userId, 1)) {
      retentionReturned.d1 += 1;
    }
  });
  retentionEligible.d7.forEach((userId) => {
    if (didReturnOnTargetDay(userId, 7)) {
      retentionReturned.d7 += 1;
    }
  });
  retentionEligible.d30.forEach((userId) => {
    if (didReturnOnTargetDay(userId, 30)) {
      retentionReturned.d30 += 1;
    }
  });

  const activityBuckets = [
    {
      key: "1_day",
      label: "1 active day",
      count: Array.from(activityDaysByUser.values()).filter((days) => days.size === 1).length,
    },
    {
      key: "2_4_days",
      label: "2-4 active days",
      count: Array.from(activityDaysByUser.values()).filter((days) => days.size >= 2 && days.size <= 4).length,
    },
    {
      key: "5_plus_days",
      label: "5+ active days",
      count: Array.from(activityDaysByUser.values()).filter((days) => days.size >= 5).length,
    },
  ];

  const topPlayerRows = Array.from(context.userPerformanceById.values())
    .filter((entry) => {
      const currentUser = context.usersById.get(entry.userId) ?? null;
      return matchesEloFilter(currentUser?.eloRating ?? null, context.filters);
    })
    .sort((left, right) => {
      if (right.matchesPlayed !== left.matchesPlayed) {
        return right.matchesPlayed - left.matchesPlayed;
      }

      return (right.lastActiveAt ?? "").localeCompare(left.lastActiveAt ?? "");
    })
    .slice(0, context.filters.limit)
    .map((entry) => {
      const user = context.usersById.get(entry.userId) ?? null;
      return {
        id: entry.userId,
        userId: entry.userId,
        label: entry.username,
        secondaryLabel: user?.currentRankTitle ?? null,
        metrics: {
          matchesPlayed: entry.matchesPlayed,
          wins: entry.wins,
          losses: entry.losses,
          winRate: toPercentage(entry.wins, Math.max(1, entry.matchesPlayed)),
          elo: user?.eloRating ?? null,
          tournamentParticipations: entry.tournamentParticipations,
          totalXp: user?.totalXp ?? null,
          lastActiveAt: entry.lastActiveAt,
        },
      } satisfies AnalyticsTableRow;
    });

  const buildRetentionMetric = (returned: number, eligible: string[], dayLabel: string): AnalyticsMetric => {
    if (eligible.length === 0) {
      return createMetric(
        null,
        noData(`No ${dayLabel} retention cohorts have matured inside the selected date range.`),
        { numerator: 0, denominator: 0 },
      );
    }

    if (eligible.length < 3) {
      return createMetric(
        toPercentage(returned, eligible.length),
        notEnoughData(`Not enough cohorts have matured for a reliable ${dayLabel} retention signal.`, eligible.length),
        { numerator: returned, denominator: eligible.length },
      );
    }

    return createMetric(
      toPercentage(returned, eligible.length),
      available(eligible.length),
      { numerator: returned, denominator: eligible.length },
    );
  };

  return {
    uniquePlayers: createMetric(
      countUniqueActiveUsers(context.activityEvents, context.filters.startMs, context.filters.endMs),
      context.activityEvents.length > 0 ? available(context.activityEvents.length) : noData("No player activity is available in this date range."),
    ),
    newPlayersOverTime: {
      availability: newPlayersByDay.size > 0 ? available(newPlayersByDay.size) : noData("No new players were first seen in this date range."),
      points: buildCountPoints(newPlayersByDay, context.filters),
    },
    returningPlayersOverTime: {
      availability: returningPlayersByDay.size > 0 ? available(returningPlayersByDay.size) : noData("No returning players were recorded in this date range."),
      points: buildCountPoints(returningPlayersByDay, context.filters),
    },
    activityBuckets: {
      availability: activityBuckets.some((bucket) => bucket.count > 0)
        ? available(activityBuckets.reduce((sum, bucket) => sum + bucket.count, 0))
        : noData("No activity buckets can be built because no player activity was recorded."),
      buckets: activityBuckets,
    },
    topPlayers: {
      availability: topPlayerRows.length > 0 ? available(topPlayerRows.length) : noData("No player rows are available for the selected filters."),
      rows: topPlayerRows,
    },
    retention: {
      availability: mergeAvailability(
        buildRetentionMetric(retentionReturned.d1, retentionEligible.d1, "D1").availability,
        buildRetentionMetric(retentionReturned.d7, retentionEligible.d7, "D7").availability,
        buildRetentionMetric(retentionReturned.d30, retentionEligible.d30, "D30").availability,
      ),
      d1: buildRetentionMetric(retentionReturned.d1, retentionEligible.d1, "D1"),
      d7: buildRetentionMetric(retentionReturned.d7, retentionEligible.d7, "D7"),
      d30: buildRetentionMetric(retentionReturned.d30, retentionEligible.d30, "D30"),
    },
  };
};

const buildGameplayData = (context: AnalyticsContext): AnalyticsGameplayData => {
  const matchesPerDay = new Map<string, number>();
  const startedByDay = new Map<string, number>();
  const completedByDay = new Map<string, number>();
  const abandonedByDay = new Map<string, number>();
  const recentMatches = filterEndedMatchesInWindow(context.unifiedMatches, context.filters.startMs, context.filters.endMs)
    .sort((left, right) => right.endedAt.localeCompare(left.endedAt))
    .slice(0, context.filters.limit);
  const startedMetrics = filterStartsInWindow(context, context.filters.startMs, context.filters.endMs);
  const matchById = new Map(context.unifiedMatches.map((match) => [match.matchId, match] as const));
  const durations = recentMatches
    .map((match) => match.durationSeconds)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const completionWindow = buildStartedMatchMetrics(context, context.filters.startMs, context.filters.endMs);
  const lightSideWinsByMode = new Map<string, { wins: number; losses: number; count: number }>();
  let captureCount = 0;
  let captureMatchCount = 0;

  filterEndedMatchesInWindow(context.unifiedMatches, context.filters.startMs, context.filters.endMs).forEach((match) => {
    const dayKey = toDayKey(match.endedAt);
    matchesPerDay.set(dayKey, (matchesPerDay.get(dayKey) ?? 0) + 1);

    if (match.modeId) {
      const bucket = lightSideWinsByMode.get(match.modeId) ?? { wins: 0, losses: 0, count: 0 };
      const lightPlayer = match.players.find((player) => player.color === "light") ?? null;
      bucket.count += 1;
      if (lightPlayer?.didWin === true) {
        bucket.wins += 1;
      } else if (lightPlayer?.didWin === false) {
        bucket.losses += 1;
      }
      lightSideWinsByMode.set(match.modeId, bucket);
    }

    const trackedCaptureCount = match.players.reduce((sum, player) => sum + (player.capturesMade ?? 0), 0);
    if (trackedCaptureCount > 0 || match.players.some((player) => player.capturesMade !== null)) {
      captureCount += trackedCaptureCount;
      captureMatchCount += 1;
    }
  });

  startedMetrics.forEach((started) => {
    const dayKey = toDayKey(started.startedAt);
    startedByDay.set(dayKey, (startedByDay.get(dayKey) ?? 0) + 1);
    const matched = matchById.get(started.matchId) ?? null;
    if (!matched) {
      abandonedByDay.set(dayKey, (abandonedByDay.get(dayKey) ?? 0) + 1);
      return;
    }

    if (matched.reason === "completed") {
      completedByDay.set(dayKey, (completedByDay.get(dayKey) ?? 0) + 1);
      return;
    }

    abandonedByDay.set(dayKey, (abandonedByDay.get(dayKey) ?? 0) + 1);
  });

  const winRateSegments: RankedSegment[] = Array.from(lightSideWinsByMode.entries())
    .map(([modeId, bucket]) => ({
      key: modeId,
      label: modeId,
      count: bucket.count,
      wins: bucket.wins,
      losses: bucket.losses,
      winRate: toPercentage(bucket.wins, Math.max(1, bucket.wins + bucket.losses)),
    }))
    .sort((left, right) => right.count - left.count);

  return {
    matchesPerDay: {
      availability: matchesPerDay.size > 0 ? available(matchesPerDay.size) : noData("No matches ended in this date range."),
      points: buildCountPoints(matchesPerDay, context.filters),
    },
    startedVsCompleted: {
      availability: startedMetrics.length > 0
        ? available(startedMetrics.length)
        : context.eventsSupported
          ? noData("No started matches were recorded in this date range.")
          : partial(["Cross-mode start tracking is not available on this runtime."]),
      points: buildDayKeys(context.filters).map((dayKey) => ({
        date: dayKey,
        started: startedByDay.get(dayKey) ?? 0,
        completed: completedByDay.get(dayKey) ?? 0,
        abandoned: abandonedByDay.get(dayKey) ?? 0,
      })),
    },
    completionFunnel: {
      availability: completionWindow.startedCount > 0
        ? available(completionWindow.startedCount)
        : context.eventsSupported
          ? noData("No started matches were recorded in this date range.")
          : partial(["Cross-mode start tracking is not available on this runtime."]),
      started: completionWindow.startedCount,
      completed: completionWindow.completedCount,
      disconnect: completionWindow.disconnectCount,
      inactivity: completionWindow.inactivityCount,
      abandoned: completionWindow.abandonedCount,
    },
    durationDistribution: {
      availability: durations.length === 0
        ? noData("No completed matches with duration data are available in this date range.")
        : durations.length < 3
          ? notEnoughData("Not enough completed matches yet to show a reliable duration distribution.", durations.length)
          : available(durations.length),
      buckets: buildBucketDistribution(durations, MATCH_DURATION_BUCKETS),
    },
    winRateByMode: {
      availability: winRateSegments.length > 0
        ? available(winRateSegments.length)
        : noData("No completed matches with mode metadata are available in this date range."),
      segments: winRateSegments,
    },
    winRateByTurnOrder: {
      availability: trackingMissing("Turn-order tracking is not implemented yet."),
    },
    disconnectRate: createMetric(
      toPercentage(completionWindow.disconnectCount + completionWindow.inactivityCount, completionWindow.startedCount),
      completionWindow.startedCount === 0
        ? noData("No started matches are available for disconnect-rate reporting in this date range.")
        : completionWindow.startedCount < 3
          ? notEnoughData("Not enough started matches yet for a stable disconnect rate.", completionWindow.startedCount)
          : available(completionWindow.startedCount),
      {
        numerator: completionWindow.disconnectCount + completionWindow.inactivityCount,
        denominator: completionWindow.startedCount,
      },
    ),
    captureRate: createMetric(
      captureMatchCount > 0 ? Math.round((captureCount / captureMatchCount) * 100) / 100 : null,
      captureMatchCount === 0
        ? noData("Capture totals are not available for matches in this date range.")
        : captureMatchCount < 3
          ? notEnoughData("Not enough matches with capture telemetry yet for a stable capture metric.", captureMatchCount)
          : available(captureMatchCount),
      {
        numerator: captureCount,
        denominator: captureMatchCount,
      },
    ),
    recentMatches: {
      availability: recentMatches.length > 0 ? available(recentMatches.length) : noData("No recent matches ended in this date range."),
      rows: recentMatches.map((match) => ({
        id: match.matchId,
        userId: null,
        label:
          match.players.find((player) => player.userId === match.winnerUserId)?.username ??
          match.winnerUserId ??
          "Unknown winner",
        secondaryLabel: match.modeId,
        metrics: {
          winner: match.players.find((player) => player.userId === match.winnerUserId)?.username ?? match.winnerUserId,
          loser: match.players.find((player) => player.userId === match.loserUserId)?.username ?? match.loserUserId,
          reason: match.reason,
          durationSeconds: match.durationSeconds,
          totalMoves: match.totalMoves,
          endedAt: match.endedAt,
        },
      })),
    },
  };
};

const buildTournamentsData = (context: AnalyticsContext): AnalyticsTournamentsData => {
  const createdByDay = new Map<string, number>();
  const entrantCounts = context.runs.map((run) => run.registrations.length);
  const dropoutByRound = new Map<number, number>();
  const recentTournamentRows = context.runs
    .slice()
    .sort((left, right) => (right.finalizedAt ?? right.updatedAt).localeCompare(left.finalizedAt ?? left.updatedAt))
    .slice(0, context.filters.limit);
  const durationValues = context.runs
    .map((run) => {
      const openedAtMs = parseIsoMs(run.openedAt ?? run.createdAt);
      const finalizedAtMs = parseIsoMs(run.finalizedAt ?? run.bracket?.finalizedAt ?? null);
      if (openedAtMs === null || finalizedAtMs === null || finalizedAtMs < openedAtMs) {
        return null;
      }

      return Math.round((finalizedAtMs - openedAtMs) / 1000);
    })
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const completedRuns = context.runs.filter((run) => Boolean(run.finalizedAt));

  context.runs.forEach((run) => {
    if (isWithinRange(run.createdAt, context.filters)) {
      const dayKey = toDayKey(run.createdAt);
      createdByDay.set(dayKey, (createdByDay.get(dayKey) ?? 0) + 1);
    }
  });

  context.tournamentMatches.forEach((match) => {
    const round = readNumberField(match, ["round"]);
    const derivedRound =
      typeof round === "number"
        ? Math.max(1, Math.floor(round))
        : (() => {
            const run = context.runs.find((candidate) => candidate.runId === match.tournamentRunId);
            const entry = run?.bracket?.entries.find((candidate) => candidate.matchId === match.matchId) ?? null;
            return entry?.round ?? null;
          })();

    if (derivedRound !== null && match.loserUserId) {
      dropoutByRound.set(derivedRound, (dropoutByRound.get(derivedRound) ?? 0) + 1);
    }
  });

  const completionDenominator = context.runs.filter((run) => isWithinRange(run.createdAt, context.filters)).length;
  const completionNumerator = context.runs.filter((run) => isWithinRange(run.finalizedAt, context.filters)).length;

  return {
    createdOverTime: {
      availability: createdByDay.size > 0 ? available(createdByDay.size) : noData("No tournaments were created in this date range."),
      points: buildCountPoints(createdByDay, context.filters),
    },
    participationCounts: {
      availability: entrantCounts.length > 0 ? available(entrantCounts.length) : noData("No tournament participation data is available for the selected filters."),
      buckets: buildBucketDistribution(entrantCounts, PARTICIPATION_BUCKETS),
    },
    completionRate: createMetric(
      toPercentage(completionNumerator, completionDenominator),
      completionDenominator === 0
        ? noData("No tournaments were created in this date range.")
        : completionDenominator < 3
          ? notEnoughData("Not enough tournaments yet for a stable completion-rate signal.", completionDenominator)
          : available(completionDenominator),
      {
        numerator: completionNumerator,
        denominator: completionDenominator,
      },
    ),
    dropoutByRound: {
      availability: dropoutByRound.size > 0
        ? available(Array.from(dropoutByRound.values()).reduce((sum, count) => sum + count, 0))
        : noData("No tournament match results are available to show round dropouts."),
      buckets: Array.from(dropoutByRound.entries())
        .sort((left, right) => left[0] - right[0])
        .map(([round, count]) => ({
          round,
          label: `Round ${round}`,
          count,
        })),
    },
    durationDistribution: {
      availability: durationValues.length === 0
        ? noData("No finalized tournaments with duration data are available.")
        : durationValues.length < 3
          ? notEnoughData("Not enough finalized tournaments yet for a stable duration distribution.", durationValues.length)
          : available(durationValues.length),
      buckets: buildBucketDistribution(durationValues, TOURNAMENT_DURATION_BUCKETS),
    },
    recentTournaments: {
      availability: recentTournamentRows.length > 0 ? available(recentTournamentRows.length) : noData("No tournaments match the selected filters."),
      rows: recentTournamentRows.map((run) => {
        const totalMatches = run.bracket?.entries.length ?? 0;
        const completedMatches = run.bracket?.entries.filter((entry) => entry.status === "completed").length ?? 0;

        return {
          id: run.runId,
          userId: null,
          label: run.title,
          secondaryLabel: getRunGameMode(run),
          metrics: {
            status: run.lifecycle,
            entrants: run.registrations.length,
            totalMatches,
            completedMatches,
            completionRate: toPercentage(completedMatches, Math.max(1, totalMatches)),
            createdAt: run.createdAt,
            openedAt: run.openedAt,
            finalizedAt: run.finalizedAt ?? run.bracket?.finalizedAt ?? null,
          },
        } satisfies AnalyticsTableRow;
      }),
    },
  };
};

const buildProgressionData = (context: AnalyticsContext): AnalyticsProgressionData => {
  const eloRows = context.leaderboardRows.filter((row) => matchesEloFilter(row.eloRating, context.filters));
  const eloDistribution = buildBucketDistribution(
    eloRows.map((row) => row.eloRating),
    ELO_BUCKETS,
  );
  const rankCounts = new Map<string, number>();
  const ratingMovementByDay = new Map<string, number[]>();
  const ratedMatchesByDay = new Map<string, number>();
  const xpAwardedByDay = new Map<string, number>();
  const recentRankUps = context.xpAwardEvents
    .filter((event) => event.rankChanged && isWithinRange(event.occurredAt, context.filters))
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, context.filters.limit);

  context.usersById.forEach((user) => {
    if (!matchesEloFilter(user.eloRating, context.filters)) {
      return;
    }

    if (user.currentRankTitle) {
      rankCounts.set(user.currentRankTitle, (rankCounts.get(user.currentRankTitle) ?? 0) + 1);
    }
  });

  context.eloHistory.forEach((record) => {
    if (!isWithinRange(record.processedAt, context.filters)) {
      return;
    }

    const dayKey = toDayKey(record.processedAt);
    const winnerDelta = Math.abs(record.playerResults.find((player) => player.userId === record.winnerUserId)?.delta ?? 0);
    if (!ratingMovementByDay.has(dayKey)) {
      ratingMovementByDay.set(dayKey, []);
    }
    ratingMovementByDay.get(dayKey)?.push(winnerDelta);
    ratedMatchesByDay.set(dayKey, (ratedMatchesByDay.get(dayKey) ?? 0) + 1);
  });

  context.xpAwardEvents.forEach((event) => {
    if (!isWithinRange(event.occurredAt, context.filters)) {
      return;
    }

    const dayKey = toDayKey(event.occurredAt);
    xpAwardedByDay.set(dayKey, (xpAwardedByDay.get(dayKey) ?? 0) + event.awardedXp);
  });

  const ratingMovementPoints = buildDayKeys(context.filters).map((dayKey) => ({
    date: dayKey,
    medianAbsoluteDelta: median(ratingMovementByDay.get(dayKey) ?? []),
    ratedMatches: ratedMatchesByDay.get(dayKey) ?? 0,
  }));

  return {
    eloDistribution: {
      availability: eloRows.length > 0 ? available(eloRows.length) : noData("No Elo leaderboard records are available for the selected filters."),
      buckets: eloDistribution,
    },
    rankDistribution: {
      availability: rankCounts.size > 0 ? available(rankCounts.size) : noData("No progression profiles are available for the selected filters."),
      buckets: PROGRESSION_RANKS.map((rank) => ({
        key: rank.title,
        label: rank.title,
        count: rankCounts.get(rank.title) ?? 0,
        min: rank.threshold,
        max: null,
      })),
    },
    ratingMovement: {
      availability: context.eloHistorySupported
        ? ratingMovementPoints.some((point) => point.ratedMatches > 0)
          ? available(ratingMovementPoints.reduce((sum, point) => sum + point.ratedMatches, 0))
          : noData("No rated match history is available in this date range.")
        : trackingMissing("Ranked match history is not listable on this runtime."),
      points: ratingMovementPoints,
    },
    xpAwardedOverTime: {
      availability: xpAwardedByDay.size > 0
        ? available(Array.from(xpAwardedByDay.values()).reduce((sum, value) => sum + value, 0))
        : noData("No XP award events are available in this date range."),
      points: buildCountPoints(xpAwardedByDay, context.filters),
    },
    recentRankUps: {
      availability: recentRankUps.length > 0 ? available(recentRankUps.length) : noData("No rank-up events were recorded in this date range."),
      rows: recentRankUps.map((event) => {
        const user = context.usersById.get(event.userId) ?? null;
        return {
          id: event.eventId,
          userId: event.userId,
          label: user?.username ?? event.userId,
          secondaryLabel: event.newRank,
          metrics: {
            awardedXp: event.awardedXp,
            source: event.source,
            previousRank: event.previousRank,
            newRank: event.newRank,
            occurredAt: event.occurredAt,
          },
        } satisfies AnalyticsTableRow;
      }),
    },
  };
};

const buildRealtimeData = (context: AnalyticsContext): AnalyticsRealtimeData => {
  const onlineSnapshot = getOnlinePresenceSnapshot();
  const activeTrackedMatches = listActiveTrackedMatches();
  const recentEvents = [...context.trackedMatchStarts, ...context.trackedMatchEnds, ...context.xpAwardEvents]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, context.filters.limit);
  const recentDisconnects = context.trackedMatchEnds
    .filter((event) => event.reason !== "completed")
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, context.filters.limit);
  const activeTournamentsCount = context.runs.filter(
    (run) => run.lifecycle === "open" || (run.lifecycle === "closed" && !run.finalizedAt),
  ).length;
  const lastEventAt = recentEvents.length > 0 ? recentEvents[0].occurredAt : null;

  return {
    onlinePlayers: createMetric(onlineSnapshot.onlineCount, available(onlineSnapshot.onlineCount)),
    activeMatches: createMetric(activeTrackedMatches.length, available(activeTrackedMatches.length)),
    activeTournaments: createMetric(activeTournamentsCount, available(activeTournamentsCount)),
    queueSize: createMetric(null, trackingMissing("Queue-size tracking is not implemented yet.")),
    queueWaitSeconds: createMetric(null, trackingMissing("Queue wait-time tracking is not implemented yet.")),
    activeMatchRows: {
      availability: activeTrackedMatches.length > 0 ? available(activeTrackedMatches.length) : noData("No active tracked matches are live right now."),
      rows: activeTrackedMatches,
    },
    recentEvents: {
      availability: recentEvents.length > 0 ? available(recentEvents.length) : noData("No recent analytics events have been recorded yet."),
      rows: recentEvents.map((event): RealtimeEventRow => {
        if (event.type === "match_start") {
          return {
            id: event.eventId,
            type: event.type,
            occurredAt: event.occurredAt,
            label: `${event.modeId} match started`,
            detail: event.players.map((player) => player.username ?? player.userId).join(" vs "),
            status: "neutral",
          };
        }

        if (event.type === "match_end") {
          return {
            id: event.eventId,
            type: event.type,
            occurredAt: event.occurredAt,
            label: event.reason === "completed" ? "Match completed" : "Match ended early",
            detail: `${event.modeId} · ${event.reason}`,
            status: event.reason === "completed" ? "success" : "warning",
          };
        }

        return {
          id: event.eventId,
          type: event.type,
          occurredAt: event.occurredAt,
          label: "XP awarded",
          detail: `${event.awardedXp} XP · ${event.newRank}`,
          status: event.rankChanged ? "success" : "neutral",
        };
      }),
    },
    recentDisconnects: {
      availability: recentDisconnects.length > 0 ? available(recentDisconnects.length) : noData("No recent disconnect or inactivity forfeits have been recorded."),
      rows: recentDisconnects.map((event) => ({
        id: event.eventId,
        type: event.reason,
        occurredAt: event.occurredAt,
        label: event.reason === "forfeit_disconnect" ? "Disconnect forfeit" : "Inactivity forfeit",
        detail: `${event.modeId} · ${event.players.map((player) => player.username ?? player.userId).join(" vs ")}`,
        status: "danger",
      })),
    },
    freshness: {
      availability: available(),
      lastEventAt,
      generatedAt: context.generatedAt,
    },
  };
};

const buildResponse = <TData extends object>(
  context: AnalyticsContext,
  data: TData,
  availability: AnalyticsAvailability,
  extraNotes: string[] = [],
): AnalyticsResponse<TData> => ({
  success: true,
  filters: toResponseFilters(context.filters),
  generatedAt: context.generatedAt,
  dataAvailability: toResponseAvailability(
    mergeAvailability(
      availability,
      extraNotes.length > 0 ? partial(extraNotes) : available(),
      context.runtimeNotes.length > 0 ? partial(context.runtimeNotes) : available(),
    ),
  ),
  data,
});

export const getAnalyticsSummary = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  payload: string,
): AnalyticsResponse<AnalyticsSummaryData> => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildSummaryData(context);
  const availability = mergeAvailability(
    data.dau.availability,
    data.wau.availability,
    data.matchesPlayed.availability,
    data.completionRate.availability,
    data.medianMatchDurationSeconds.availability,
    data.disconnectRate.availability,
  );

  return buildResponse(context, data, availability);
};

export const getAnalyticsOverview = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  payload: string,
): AnalyticsResponse<AnalyticsOverviewData> => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildOverviewData(context);
  const availability = mergeAvailability(
    data.dauTrend.availability,
    data.wauTrend.availability,
    data.matchesPerDay.availability,
    data.completionRateTrend.availability,
    data.newVsReturningPlayers.availability,
  );

  return buildResponse(context, data, availability);
};

export const getAnalyticsPlayers = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  payload: string,
): AnalyticsResponse<AnalyticsPlayersData> => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildPlayersData(context);
  const availability = mergeAvailability(
    data.uniquePlayers.availability,
    data.newPlayersOverTime.availability,
    data.returningPlayersOverTime.availability,
    data.activityBuckets.availability,
    data.topPlayers.availability,
    data.retention.availability,
  );

  return buildResponse(context, data, availability);
};

export const getAnalyticsGameplay = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  payload: string,
): AnalyticsResponse<AnalyticsGameplayData> => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildGameplayData(context);
  const availability = mergeAvailability(
    data.matchesPerDay.availability,
    data.startedVsCompleted.availability,
    data.completionFunnel.availability,
    data.durationDistribution.availability,
    data.winRateByMode.availability,
    data.winRateByTurnOrder.availability,
    data.disconnectRate.availability,
    data.captureRate.availability,
  );

  return buildResponse(context, data, availability);
};

export const getAnalyticsTournaments = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  payload: string,
): AnalyticsResponse<AnalyticsTournamentsData> => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildTournamentsData(context);
  const availability = mergeAvailability(
    data.createdOverTime.availability,
    data.participationCounts.availability,
    data.completionRate.availability,
    data.dropoutByRound.availability,
    data.durationDistribution.availability,
    data.recentTournaments.availability,
  );

  return buildResponse(context, data, availability);
};

export const getAnalyticsProgression = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  payload: string,
): AnalyticsResponse<AnalyticsProgressionData> => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildProgressionData(context);
  const availability = mergeAvailability(
    data.eloDistribution.availability,
    data.rankDistribution.availability,
    data.ratingMovement.availability,
    data.xpAwardedOverTime.availability,
    data.recentRankUps.availability,
  );

  return buildResponse(context, data, availability);
};

export const getAnalyticsRealtime = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  payload: string,
): AnalyticsResponse<AnalyticsRealtimeData> => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildRealtimeData(context);
  const availability = mergeAvailability(
    data.onlinePlayers.availability,
    data.activeMatches.availability,
    data.activeTournaments.availability,
    data.queueSize.availability,
    data.queueWaitSeconds.availability,
    data.activeMatchRows.availability,
    data.recentEvents.availability,
    data.recentDisconnects.availability,
    data.freshness.availability,
  );

  return buildResponse(context, data, availability);
};

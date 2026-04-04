import type { PlayerColor } from "../../../logic/types";

type RuntimeLogger = any;
type RuntimeNakama = any;

type RuntimeRecord = Record<string, unknown>;

type MatchEndReason = "completed" | "forfeit_inactivity" | "forfeit_disconnect";

export type AnalyticsMatchClassification = {
  ranked: boolean;
  casual: boolean;
  private: boolean;
  bot: boolean;
  experimental: boolean;
  tournament: boolean;
};

export type AnalyticsMatchPlayer = {
  userId: string;
  username: string | null;
  color: PlayerColor;
  didWin: boolean | null;
  capturesMade: number | null;
  capturesSuffered: number | null;
  playerMoveCount: number | null;
  finishedCount: number | null;
  isBot: boolean;
};

export type MatchStartAnalyticsEvent = {
  eventId: string;
  type: "match_start";
  occurredAt: string;
  matchId: string;
  startedAt: string;
  modeId: string;
  classification: AnalyticsMatchClassification;
  tournamentRunId: string | null;
  tournamentId: string | null;
  players: AnalyticsMatchPlayer[];
};

export type MatchEndAnalyticsEvent = {
  eventId: string;
  type: "match_end";
  occurredAt: string;
  matchId: string;
  startedAt: string | null;
  endedAt: string;
  durationSeconds: number | null;
  modeId: string;
  reason: MatchEndReason;
  classification: AnalyticsMatchClassification;
  tournamentRunId: string | null;
  tournamentId: string | null;
  winnerUserId: string | null;
  loserUserId: string | null;
  totalMoves: number;
  totalTurns: number;
  players: AnalyticsMatchPlayer[];
};

export type XpAwardAnalyticsEvent = {
  eventId: string;
  type: "xp_awarded";
  occurredAt: string;
  userId: string;
  awardedXp: number;
  source: string;
  sourceId: string;
  matchId: string | null;
  previousTotalXp: number;
  newTotalXp: number;
  previousRank: string;
  newRank: string;
  rankChanged: boolean;
};

export type AnalyticsEvent =
  | MatchStartAnalyticsEvent
  | MatchEndAnalyticsEvent
  | XpAwardAnalyticsEvent;

export type ActiveTrackedMatch = {
  matchId: string;
  startedAt: string;
  modeId: string;
  tournamentRunId: string | null;
  tournamentId: string | null;
  playerLabels: string[];
};

type StorageListResult = {
  objects: Array<{
    collection?: string;
    key?: string;
    userId?: string;
    value?: unknown;
    version?: string;
  }>;
  cursor: string | null;
};

const STORAGE_PERMISSION_NONE = 0;
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
const ONLINE_TTL_MS = 30_000;
const ANALYTICS_EVENT_PAGE_SIZE = 100;
const ANALYTICS_EVENT_MAX_PAGES = 50;

export const ANALYTICS_EVENT_COLLECTION = "analytics_events";

const onlinePresenceByUser = new Map<string, number>();
const activeMatchesById = new Map<string, ActiveTrackedMatch>();

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

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const buildEventId = (type: AnalyticsEvent["type"], occurredAt: string, scope: string): string => {
  const compactTimestamp = occurredAt.replace(/[^0-9]/g, "");
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${type}:${scope}:${compactTimestamp}:${randomSuffix}`;
};

const pruneOnlinePresence = (nowMs: number): void => {
  onlinePresenceByUser.forEach((lastSeenMs, userId) => {
    if (nowMs - lastSeenMs > ONLINE_TTL_MS) {
      onlinePresenceByUser.delete(userId);
    }
  });
};

const normalizeClassification = (value: unknown): AnalyticsMatchClassification | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    ranked: readBooleanField(record, ["ranked"]) === true,
    casual: readBooleanField(record, ["casual"]) === true,
    private: readBooleanField(record, ["private"]) === true,
    bot: readBooleanField(record, ["bot"]) === true,
    experimental: readBooleanField(record, ["experimental"]) === true,
    tournament: readBooleanField(record, ["tournament"]) === true,
  };
};

const normalizeMatchPlayer = (value: unknown): AnalyticsMatchPlayer | null => {
  const record = asRecord(value);
  const userId = readStringField(record, ["userId", "user_id"]);
  const color = readStringField(record, ["color"]);

  if (!record || !userId || (color !== "light" && color !== "dark")) {
    return null;
  }

  return {
    userId,
    username: readStringField(record, ["username"]),
    color,
    didWin: (() => {
      const didWin = readBooleanField(record, ["didWin", "did_win"]);
      return typeof didWin === "boolean" ? didWin : null;
    })(),
    capturesMade: readNumberField(record, ["capturesMade", "captures_made"]),
    capturesSuffered: readNumberField(record, ["capturesSuffered", "captures_suffered"]),
    playerMoveCount: readNumberField(record, ["playerMoveCount", "player_move_count"]),
    finishedCount: readNumberField(record, ["finishedCount", "finished_count"]),
    isBot: readBooleanField(record, ["isBot", "is_bot"]) === true,
  };
};

const normalizeMatchStartEvent = (value: unknown): MatchStartAnalyticsEvent | null => {
  const record = asRecord(value);
  const eventId = readStringField(record, ["eventId", "event_id"]);
  const occurredAt = readStringField(record, ["occurredAt", "occurred_at"]);
  const matchId = readStringField(record, ["matchId", "match_id"]);
  const startedAt = readStringField(record, ["startedAt", "started_at"]);
  const modeId = readStringField(record, ["modeId", "mode_id"]);
  const classification = normalizeClassification(record?.classification);

  if (!record || !eventId || !occurredAt || !matchId || !startedAt || !modeId || !classification) {
    return null;
  }

  return {
    eventId,
    type: "match_start",
    occurredAt,
    matchId,
    startedAt,
    modeId,
    classification,
    tournamentRunId: readStringField(record, ["tournamentRunId", "tournament_run_id"]),
    tournamentId: readStringField(record, ["tournamentId", "tournament_id"]),
    players: Array.isArray(record.players)
      ? record.players
          .map((player) => normalizeMatchPlayer(player))
          .filter((player): player is AnalyticsMatchPlayer => Boolean(player))
      : [],
  };
};

const normalizeMatchEndEvent = (value: unknown): MatchEndAnalyticsEvent | null => {
  const record = asRecord(value);
  const eventId = readStringField(record, ["eventId", "event_id"]);
  const occurredAt = readStringField(record, ["occurredAt", "occurred_at"]);
  const matchId = readStringField(record, ["matchId", "match_id"]);
  const endedAt = readStringField(record, ["endedAt", "ended_at"]);
  const modeId = readStringField(record, ["modeId", "mode_id"]);
  const reason = readStringField(record, ["reason"]);
  const classification = normalizeClassification(record?.classification);

  if (
    !record ||
    !eventId ||
    !occurredAt ||
    !matchId ||
    !endedAt ||
    !modeId ||
    !classification ||
    (reason !== "completed" && reason !== "forfeit_inactivity" && reason !== "forfeit_disconnect")
  ) {
    return null;
  }

  return {
    eventId,
    type: "match_end",
    occurredAt,
    matchId,
    startedAt: readStringField(record, ["startedAt", "started_at"]),
    endedAt,
    durationSeconds: readNumberField(record, ["durationSeconds", "duration_seconds"]),
    modeId,
    reason,
    classification,
    tournamentRunId: readStringField(record, ["tournamentRunId", "tournament_run_id"]),
    tournamentId: readStringField(record, ["tournamentId", "tournament_id"]),
    winnerUserId: readStringField(record, ["winnerUserId", "winner_user_id"]),
    loserUserId: readStringField(record, ["loserUserId", "loser_user_id"]),
    totalMoves: Math.max(0, Math.floor(readNumberField(record, ["totalMoves", "total_moves"]) ?? 0)),
    totalTurns: Math.max(0, Math.floor(readNumberField(record, ["totalTurns", "total_turns"]) ?? 0)),
    players: Array.isArray(record.players)
      ? record.players
          .map((player) => normalizeMatchPlayer(player))
          .filter((player): player is AnalyticsMatchPlayer => Boolean(player))
      : [],
  };
};

const normalizeXpAwardEvent = (value: unknown): XpAwardAnalyticsEvent | null => {
  const record = asRecord(value);
  const eventId = readStringField(record, ["eventId", "event_id"]);
  const occurredAt = readStringField(record, ["occurredAt", "occurred_at"]);
  const userId = readStringField(record, ["userId", "user_id"]);
  const source = readStringField(record, ["source"]);
  const sourceId = readStringField(record, ["sourceId", "source_id"]);

  if (!record || !eventId || !occurredAt || !userId || !source || !sourceId) {
    return null;
  }

  return {
    eventId,
    type: "xp_awarded",
    occurredAt,
    userId,
    awardedXp: Math.max(0, Math.floor(readNumberField(record, ["awardedXp", "awarded_xp"]) ?? 0)),
    source,
    sourceId,
    matchId: readStringField(record, ["matchId", "match_id"]),
    previousTotalXp: Math.max(
      0,
      Math.floor(readNumberField(record, ["previousTotalXp", "previous_total_xp"]) ?? 0),
    ),
    newTotalXp: Math.max(0, Math.floor(readNumberField(record, ["newTotalXp", "new_total_xp"]) ?? 0)),
    previousRank: readStringField(record, ["previousRank", "previous_rank"]) ?? "Laborer",
    newRank: readStringField(record, ["newRank", "new_rank"]) ?? "Laborer",
    rankChanged: readBooleanField(record, ["rankChanged", "rank_changed"]) === true,
  };
};

const normalizeAnalyticsEvent = (value: unknown): AnalyticsEvent | null => {
  const record = asRecord(value);
  const type = readStringField(record, ["type"]);

  if (type === "match_start") {
    return normalizeMatchStartEvent(record);
  }

  if (type === "match_end") {
    return normalizeMatchEndEvent(record);
  }

  if (type === "xp_awarded") {
    return normalizeXpAwardEvent(record);
  }

  return null;
};

const normalizeStorageListResult = (value: unknown): StorageListResult => {
  if (Array.isArray(value)) {
    return {
      objects: value.map((object) => (asRecord(object) ?? {})),
      cursor: null,
    };
  }

  const record = asRecord(value);
  const objects = Array.isArray(record?.objects) ? record.objects.map((object) => (asRecord(object) ?? {})) : [];

  return {
    objects,
    cursor: readStringField(record, ["cursor", "nextCursor", "next_cursor"]),
  };
};

const writeEvent = (nk: RuntimeNakama, logger: RuntimeLogger, event: AnalyticsEvent): void => {
  try {
    nk.storageWrite([
      {
        collection: ANALYTICS_EVENT_COLLECTION,
        key: event.eventId,
        userId: SYSTEM_USER_ID,
        value: event,
        version: "*",
        permissionRead: STORAGE_PERMISSION_NONE,
        permissionWrite: STORAGE_PERMISSION_NONE,
      },
    ]);
  } catch (error) {
    logger.warn("Unable to write analytics event %s: %s", event.eventId, getErrorMessage(error));
  }
};

export const trackPresenceHeartbeat = (userId: string): { onlineCount: number; onlineTtlMs: number; serverTimeMs: number } => {
  const nowMs = Date.now();
  onlinePresenceByUser.set(userId, nowMs);
  pruneOnlinePresence(nowMs);

  return {
    onlineCount: onlinePresenceByUser.size,
    onlineTtlMs: ONLINE_TTL_MS,
    serverTimeMs: nowMs,
  };
};

export const getOnlinePresenceSnapshot = (): {
  onlineCount: number;
  onlineTtlMs: number;
  serverTimeMs: number;
} => {
  const nowMs = Date.now();
  pruneOnlinePresence(nowMs);

  return {
    onlineCount: onlinePresenceByUser.size,
    onlineTtlMs: ONLINE_TTL_MS,
    serverTimeMs: nowMs,
  };
};

export const recordMatchStartAnalyticsEvent = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  event: Omit<MatchStartAnalyticsEvent, "eventId" | "type" | "occurredAt">,
): void => {
  const occurredAt = event.startedAt;
  const normalizedEvent: MatchStartAnalyticsEvent = {
    eventId: buildEventId("match_start", occurredAt, event.matchId),
    type: "match_start",
    occurredAt,
    ...event,
  };

  activeMatchesById.set(event.matchId, {
    matchId: event.matchId,
    startedAt: event.startedAt,
    modeId: event.modeId,
    tournamentRunId: event.tournamentRunId,
    tournamentId: event.tournamentId,
    playerLabels: event.players
      .map((player) => player.username ?? player.userId)
      .filter((playerLabel) => playerLabel.length > 0),
  });
  writeEvent(nk, logger, normalizedEvent);
};

export const recordMatchEndAnalyticsEvent = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  event: Omit<MatchEndAnalyticsEvent, "eventId" | "type" | "occurredAt">,
): void => {
  const occurredAt = event.endedAt;
  const normalizedEvent: MatchEndAnalyticsEvent = {
    eventId: buildEventId("match_end", occurredAt, event.matchId),
    type: "match_end",
    occurredAt,
    ...event,
  };

  activeMatchesById.delete(event.matchId);
  writeEvent(nk, logger, normalizedEvent);
};

export const recordXpAwardAnalyticsEvent = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  event: Omit<XpAwardAnalyticsEvent, "eventId" | "type" | "occurredAt"> & { occurredAt?: string },
): void => {
  const occurredAt = event.occurredAt ?? new Date().toISOString();
  const normalizedEvent: XpAwardAnalyticsEvent = {
    eventId: buildEventId("xp_awarded", occurredAt, `${event.userId}:${event.sourceId}`),
    type: "xp_awarded",
    occurredAt,
    userId: event.userId,
    awardedXp: event.awardedXp,
    source: event.source,
    sourceId: event.sourceId,
    matchId: event.matchId,
    previousTotalXp: event.previousTotalXp,
    newTotalXp: event.newTotalXp,
    previousRank: event.previousRank,
    newRank: event.newRank,
    rankChanged: event.rankChanged,
  };

  writeEvent(nk, logger, normalizedEvent);
};

export const unregisterActiveMatch = (matchId: string): void => {
  activeMatchesById.delete(matchId);
};

export const listActiveTrackedMatches = (): ActiveTrackedMatch[] =>
  Array.from(activeMatchesById.values()).sort((left, right) => left.startedAt.localeCompare(right.startedAt) * -1);

export const listAnalyticsEvents = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
): {
  supported: boolean;
  notes: string[];
  events: AnalyticsEvent[];
} => {
  if (typeof nk.storageList !== "function") {
    return {
      supported: false,
      notes: ["Analytics event storage listing is not supported by this Nakama runtime."],
      events: [],
    };
  }

  const events: AnalyticsEvent[] = [];
  let cursor = "";

  for (let page = 0; page < ANALYTICS_EVENT_MAX_PAGES; page += 1) {
    try {
      const rawResult = nk.storageList(SYSTEM_USER_ID, ANALYTICS_EVENT_COLLECTION, ANALYTICS_EVENT_PAGE_SIZE, cursor);
      const result = normalizeStorageListResult(rawResult);

      result.objects.forEach((object) => {
        const event = normalizeAnalyticsEvent(object.value);
        if (event) {
          events.push(event);
        }
      });

      if (!result.cursor) {
        break;
      }

      cursor = result.cursor;
    } catch (error) {
      logger.warn("Unable to list analytics events: %s", getErrorMessage(error));
      return {
        supported: false,
        notes: ["Analytics event storage could not be listed from the current runtime."],
        events: [],
      };
    }
  }

  return {
    supported: true,
    notes: [],
    events: events.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt)),
  };
};

import type { AnalyticsFilters } from "./types";

type RuntimeRecord = Record<string, unknown>;

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const DEFAULT_RANGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

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

const parsePayload = (payload: string): RuntimeRecord => {
  if (!payload) {
    return {};
  }

  const parsed = JSON.parse(payload) as unknown;
  return asRecord(parsed) ?? {};
};

const clampLimit = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }

  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(parsed)));
};

const parseDateMs = (value: string | null, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sanitizeRange = (startMs: number, endMs: number): { startMs: number; endMs: number } => {
  if (startMs <= endMs) {
    return { startMs, endMs };
  }

  return { startMs: endMs, endMs: startMs };
};

export const parseAnalyticsFilters = (payload: string, now = Date.now()): AnalyticsFilters => {
  const parsed = parsePayload(payload);
  const fallbackEndMs = now;
  const fallbackStartMs = fallbackEndMs - (DEFAULT_RANGE_DAYS - 1) * DAY_MS;
  const rawStartMs = parseDateMs(
    readStringField(parsed, ["startDate", "start_date"]),
    fallbackStartMs,
  );
  const rawEndMs = parseDateMs(
    readStringField(parsed, ["endDate", "end_date"]),
    fallbackEndMs,
  );
  const { startMs, endMs } = sanitizeRange(rawStartMs, rawEndMs);
  const tournamentId = readStringField(parsed, ["tournamentId", "tournament_id"]);
  const gameMode = readStringField(parsed, ["gameMode", "game_mode"]);
  const eloMin = readNumberField(parsed, ["eloMin", "elo_min"]);
  const eloMax = readNumberField(parsed, ["eloMax", "elo_max"]);

  return {
    startDate: new Date(startMs).toISOString(),
    endDate: new Date(endMs).toISOString(),
    startMs,
    endMs,
    tournamentId,
    gameMode,
    eloMin: typeof eloMin === "number" ? Math.floor(eloMin) : null,
    eloMax: typeof eloMax === "number" ? Math.floor(eloMax) : null,
    limit: clampLimit(parsed.limit),
  };
};

export const isWithinRange = (value: string | null | undefined, filters: AnalyticsFilters): boolean => {
  if (!value) {
    return false;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed >= filters.startMs && parsed <= filters.endMs;
};

export const toResponseFilters = (
  filters: AnalyticsFilters,
): Omit<AnalyticsFilters, "startMs" | "endMs"> => ({
  startDate: filters.startDate,
  endDate: filters.endDate,
  tournamentId: filters.tournamentId,
  gameMode: filters.gameMode,
  eloMin: filters.eloMin,
  eloMax: filters.eloMax,
  limit: filters.limit,
});

export const DAY_BUCKET_MS = DAY_MS;

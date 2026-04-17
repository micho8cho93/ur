import {
  MAX_WRITE_ATTEMPTS,
  RuntimeStorageObject,
  STORAGE_PERMISSION_NONE,
  asRecord,
  findStorageObject,
  getErrorMessage,
  getStorageObjectVersion,
} from "../progression";
import type {
  RuntimeContext,
  RuntimeLogger,
  RuntimeMetadata,
  RuntimeNakama,
  TournamentCreateRpcRequest,
  TournamentIndexRecord,
  TournamentMatchResult,
  TournamentParticipant,
  TournamentRecord,
  TournamentScoringSettings,
  TournamentStatus,
  TournamentSummary,
} from "./types";
import { getXpAwardAmount } from "../../../shared/progression";

export { MAX_WRITE_ATTEMPTS, STORAGE_PERMISSION_NONE };

export const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export const TOURNAMENT_COLLECTION = "tournaments";
export const TOURNAMENT_INDEX_KEY = "index";
export const TOURNAMENT_AUDIT_COLLECTION = "tournament_audit_logs";
export const TOURNAMENT_AUDIT_LOG_KEY = "recent";

export const DEFAULT_LIST_LIMIT = 50;
export const MAX_LIST_LIMIT = 100;
export const DEFAULT_AUDIT_LIMIT = 50;
export const MAX_AUDIT_LIMIT = 200;
export const MAX_AUDIT_LOG_ENTRIES = 500;
export const DEFAULT_MAX_PARTICIPANTS = 32;
export const MAX_TOURNAMENT_PARTICIPANTS = 4096;

export const RPC_TOURNAMENT_LIST = "tournament_admin_list";
export const RPC_TOURNAMENT_GET = "tournament_admin_get";
export const RPC_TOURNAMENT_CREATE = "tournament_admin_create";
export const RPC_TOURNAMENT_UPDATE_STATUS = "tournament_admin_update_status";
export const RPC_TOURNAMENT_UPSERT_RESULT = "tournament_admin_upsert_result";
export const RPC_TOURNAMENT_JOIN = "tournament_join";
export const RPC_TOURNAMENT_STANDINGS = "tournament_get_standings";
export const RPC_TOURNAMENT_AUDIT_LOG = "tournament_admin_audit_log";

export const DEFAULT_TOURNAMENT_SCORING: TournamentScoringSettings = {
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  allowDraws: true,
};

export const DEFAULT_REWARD_TIERS = [
  { rank: 1, title: "Champion", percentage: 0.5 },
  { rank: 2, title: "Finalist", percentage: 0.3 },
  { rank: 3, title: "Semifinalist", percentage: 0.2 },
] as const;

export type TournamentXpRewardSettings = {
  xpPerMatchWin: number;
  xpForTournamentChampion: number;
};

export const DEFAULT_TOURNAMENT_XP_PER_MATCH_WIN = getXpAwardAmount("pvp_win");
export const DEFAULT_TOURNAMENT_XP_FOR_CHAMPION = getXpAwardAmount("tournament_champion");

const TOURNAMENT_STATUSES: TournamentStatus[] = [
  "draft",
  "scheduled",
  "live",
  "complete",
  "cancelled",
];

export const readStringField = (value: unknown, keys: string[]): string | null => {
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

export const readNumberField = (value: unknown, keys: string[]): number | null => {
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

export const readBooleanField = (value: unknown, keys: string[]): boolean | null => {
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

export const readStringArrayField = (value: unknown, keys: string[]): string[] => {
  const record = asRecord(value);
  if (!record) {
    return [];
  }

  for (const key of keys) {
    const field = record[key];
    if (Array.isArray(field)) {
      return Array.from(
        new Set(
          field
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
        ),
      );
    }
  }

  return [];
};

export const clampListLimit = (value: unknown, fallback = DEFAULT_LIST_LIMIT, max = MAX_LIST_LIMIT): number => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const floored = Math.floor(parsed);
  if (floored < 1) {
    return 1;
  }

  return Math.min(max, floored);
};

export const parseJsonPayload = (payload: string): Record<string, unknown> => {
  if (!payload) {
    return {};
  }

  const parsed = JSON.parse(payload) as unknown;
  const record = asRecord(parsed);
  if (!record) {
    throw new Error("RPC payload must be a JSON object.");
  }

  return record;
};

export const requireAuthenticatedUserId = (ctx: RuntimeContext): string => {
  const userId = readStringField(ctx, ["userId", "user_id"]);
  if (!userId) {
    throw new Error("Authentication required.");
  }

  return userId;
};

export const getActorLabel = (ctx: RuntimeContext): string => {
  const ctxRecord = asRecord(ctx);
  const vars = asRecord(ctxRecord?.vars);

  return (
    readStringField(ctxRecord, ["username", "displayName", "display_name", "name"]) ??
    readStringField(vars, ["usernameDisplay", "username_display", "displayName", "display_name", "email"]) ??
    requireAuthenticatedUserId(ctx)
  );
};

export const normalizeTournamentStatus = (
  value: unknown,
  fallback: TournamentStatus = "draft",
): TournamentStatus => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase() as TournamentStatus;
  return TOURNAMENT_STATUSES.indexOf(normalized) >= 0 ? normalized : fallback;
};

export const ensureIsoDateString = (value: string, fieldName: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO date string.`);
  }

  return parsed.toISOString();
};

const clampPositiveInteger = (value: unknown, fallback: number, max: number): number => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const floored = Math.floor(parsed);
  if (floored < 2) {
    return 2;
  }

  return Math.min(max, floored);
};

const clampNonNegativeInteger = (value: unknown, fallback: number, max: number): number => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.min(max, Math.floor(parsed)));
};

const normalizeCurrency = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeRewardPoolAmount = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
};

export type TournamentGemRewardSettings = {
  gemsForRank1: number;
  gemsForRank2: number;
  gemsForRank3: number;
};

export const resolveTournamentGemRewardSettings = (value: unknown): TournamentGemRewardSettings => ({
  gemsForRank1: clampNonNegativeInteger(
    readNumberField(value, ["gemsForRank1", "gems_for_rank_1", "gemsForChampion", "gems_for_champion"]),
    0,
    1_000_000,
  ),
  gemsForRank2: clampNonNegativeInteger(
    readNumberField(value, ["gemsForRank2", "gems_for_rank_2", "gemsForFinalist", "gems_for_finalist"]),
    0,
    1_000_000,
  ),
  gemsForRank3: clampNonNegativeInteger(
    readNumberField(value, ["gemsForRank3", "gems_for_rank_3", "gemsForSemifinalist", "gems_for_semifinalist"]),
    0,
    1_000_000,
  ),
});

export const resolveTournamentXpRewardSettings = (value: unknown): TournamentXpRewardSettings => ({
  xpPerMatchWin: clampNonNegativeInteger(
    readNumberField(value, [
      "xpPerMatchWin",
      "xp_per_match_win",
      "matchWinXp",
      "match_win_xp",
      "tournamentMatchWinXp",
      "tournament_match_win_xp",
    ]),
    DEFAULT_TOURNAMENT_XP_PER_MATCH_WIN,
    1_000_000,
  ),
  xpForTournamentChampion: clampNonNegativeInteger(
    readNumberField(value, [
      "xpForTournamentChampion",
      "xp_for_tournament_champion",
      "championXp",
      "champion_xp",
      "tournamentChampionXp",
      "tournament_champion_xp",
    ]),
    DEFAULT_TOURNAMENT_XP_FOR_CHAMPION,
    1_000_000,
  ),
});

export const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const buildUniqueTournamentId = (
  preferredId: string | null,
  fallbackName: string,
  existingIds: string[],
): string => {
  const existing = new Set(existingIds);
  const base = slugify(preferredId ?? fallbackName) || `tournament-${Date.now()}`;

  if (!existing.has(base)) {
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (existing.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
};

const normalizeParticipant = (value: unknown): TournamentParticipant | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const userId = readStringField(record, ["userId", "user_id"]);
  const displayName = readStringField(record, ["displayName", "display_name"]);
  const joinedAt = readStringField(record, ["joinedAt", "joined_at"]);

  if (!userId || !displayName || !joinedAt) {
    return null;
  }

  const status = readStringField(record, ["status"]);
  const seed = readNumberField(record, ["seed"]);

  return {
    userId,
    displayName,
    joinedAt,
    status:
      status === "checked_in" || status === "eliminated" || status === "joined"
        ? status
        : "joined",
    seed: typeof seed === "number" && Number.isFinite(seed) ? Math.floor(seed) : null,
  };
};

const normalizeResult = (value: unknown): TournamentMatchResult | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const matchId = readStringField(record, ["matchId", "match_id"]);
  const submittedByUserId = readStringField(record, ["submittedByUserId", "submitted_by_user_id"]);
  const submittedAt = readStringField(record, ["submittedAt", "submitted_at"]);
  const playerAUserId = readStringField(record, ["playerAUserId", "player_a_user_id"]);
  const playerBUserId = readStringField(record, ["playerBUserId", "player_b_user_id"]);
  const scoreA = readNumberField(record, ["scoreA", "score_a"]);
  const scoreB = readNumberField(record, ["scoreB", "score_b"]);
  const round = readNumberField(record, ["round"]);

  if (
    !matchId ||
    !submittedByUserId ||
    !submittedAt ||
    !playerAUserId ||
    !playerBUserId ||
    typeof scoreA !== "number" ||
    typeof scoreB !== "number" ||
    typeof round !== "number"
  ) {
    return null;
  }

  return {
    matchId,
    round: Math.max(1, Math.floor(round)),
    submittedByUserId,
    submittedAt,
    playerAUserId,
    playerBUserId,
    scoreA,
    scoreB,
    winnerUserId: readStringField(record, ["winnerUserId", "winner_user_id"]),
    notes: readStringField(record, ["notes"]) ?? null,
  };
};

export const normalizeTournamentRecord = (value: unknown, fallbackId?: string): TournamentRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = readStringField(record, ["id"]) ?? fallbackId ?? null;
  const name = readStringField(record, ["name"]);
  const startsAt = readStringField(record, ["startsAt", "starts_at"]);
  const createdAt = readStringField(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField(record, ["updatedAt", "updated_at"]);
  const createdByUserId = readStringField(record, ["createdByUserId", "created_by_user_id"]);
  const createdByLabel = readStringField(record, ["createdByLabel", "created_by_label"]);

  if (!id || !name || !startsAt || !createdAt || !updatedAt || !createdByUserId || !createdByLabel) {
    return null;
  }

  const rawParticipants = Array.isArray(record.participants) ? record.participants : [];
  const rawResults = Array.isArray(record.results) ? record.results : [];
  const scoringRecord = asRecord(record.scoring);
  const participants = rawParticipants
    .map((entry) => normalizeParticipant(entry))
    .filter((entry): entry is TournamentParticipant => Boolean(entry));
  const results = rawResults
    .map((entry) => normalizeResult(entry))
    .filter((entry): entry is TournamentMatchResult => Boolean(entry))
    .sort((left, right) => {
      if (left.round !== right.round) {
        return left.round - right.round;
      }

      return left.submittedAt.localeCompare(right.submittedAt);
    });

  return {
    id,
    slug: readStringField(record, ["slug"]) ?? id,
    name,
    description: readStringField(record, ["description"]) ?? "",
    status: normalizeTournamentStatus(record.status, "draft"),
    startsAt,
    createdAt,
    updatedAt,
    createdByUserId,
    createdByLabel,
    region: readStringField(record, ["region"]) ?? "Global",
    gameMode: readStringField(record, ["gameMode", "game_mode"]) ?? "Standard",
    entryFee: readStringField(record, ["entryFee", "entry_fee"]) ?? "Free",
    maxParticipants: clampPositiveInteger(
      readNumberField(record, ["maxParticipants", "max_participants"]),
      DEFAULT_MAX_PARTICIPANTS,
      MAX_TOURNAMENT_PARTICIPANTS,
    ),
    rewardCurrency: normalizeCurrency(record.rewardCurrency),
    rewardPoolAmount: normalizeRewardPoolAmount(record.rewardPoolAmount),
    rewardNotes: readStringField(record, ["rewardNotes", "reward_notes"]),
    tags: readStringArrayField(record, ["tags"]),
    scoring: {
      winPoints: readNumberField(scoringRecord, ["winPoints", "win_points"]) ?? DEFAULT_TOURNAMENT_SCORING.winPoints,
      drawPoints:
        readNumberField(scoringRecord, ["drawPoints", "draw_points"]) ?? DEFAULT_TOURNAMENT_SCORING.drawPoints,
      lossPoints:
        readNumberField(scoringRecord, ["lossPoints", "loss_points"]) ?? DEFAULT_TOURNAMENT_SCORING.lossPoints,
      allowDraws:
        readBooleanField(scoringRecord, ["allowDraws", "allow_draws"]) ?? DEFAULT_TOURNAMENT_SCORING.allowDraws,
    },
    participants,
    results,
  };
};

export const normalizeTournamentIndexRecord = (value: unknown): TournamentIndexRecord => {
  const record = asRecord(value);
  const ids = record && Array.isArray(record.tournamentIds) ? record.tournamentIds : [];

  return {
    tournamentIds: Array.from(
      new Set(ids.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)),
    ),
    updatedAt: readStringField(record, ["updatedAt", "updated_at"]) ?? new Date(0).toISOString(),
  };
};

export const buildTournamentSummary = (tournament: TournamentRecord): TournamentSummary => ({
  id: tournament.id,
  name: tournament.name,
  status: tournament.status,
  startsAt: tournament.startsAt,
  updatedAt: tournament.updatedAt,
  region: tournament.region,
  gameMode: tournament.gameMode,
  participantsCount: tournament.participants.length,
  maxParticipants: tournament.maxParticipants,
  rewardPoolAmount: tournament.rewardPoolAmount,
  rewardCurrency: tournament.rewardCurrency,
});

export const createTournamentRecord = (
  ctx: RuntimeContext,
  request: TournamentCreateRpcRequest,
  existingIds: string[],
): TournamentRecord => {
  const createdAt = new Date().toISOString();
  const createdByUserId = requireAuthenticatedUserId(ctx);
  const createdByLabel = getActorLabel(ctx);
  const id = buildUniqueTournamentId(request.tournamentId ?? null, request.name, existingIds);
  const tags = Array.from(new Set((request.tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0)));

  return {
    id,
    slug: id,
    name: request.name.trim(),
    description: request.description?.trim() ?? "",
    status: normalizeTournamentStatus(request.status, "draft"),
    startsAt: ensureIsoDateString(request.startsAt, "startsAt"),
    createdAt,
    updatedAt: createdAt,
    createdByUserId,
    createdByLabel,
    region: request.region?.trim() || "Global",
    gameMode: request.gameMode?.trim() || "Standard",
    entryFee: request.entryFee?.trim() || "Free",
    maxParticipants: clampPositiveInteger(
      request.maxParticipants,
      DEFAULT_MAX_PARTICIPANTS,
      MAX_TOURNAMENT_PARTICIPANTS,
    ),
    rewardCurrency: normalizeCurrency(request.rewardCurrency),
    rewardPoolAmount: normalizeRewardPoolAmount(request.rewardPoolAmount),
    rewardNotes: request.rewardNotes?.trim() || null,
    tags,
    scoring: {
      winPoints: DEFAULT_TOURNAMENT_SCORING.winPoints,
      drawPoints: DEFAULT_TOURNAMENT_SCORING.drawPoints,
      lossPoints: DEFAULT_TOURNAMENT_SCORING.lossPoints,
      allowDraws: DEFAULT_TOURNAMENT_SCORING.allowDraws,
    },
    participants: [],
    results: [],
  };
};

export const buildTournamentResultId = (
  tournamentId: string,
  round: number,
  playerAUserId: string,
  playerBUserId: string,
): string => {
  const orderedPlayers = [playerAUserId, playerBUserId].sort();
  return `${tournamentId}-r${round}-${orderedPlayers[0]}-${orderedPlayers[1]}`;
};

export const readTournamentIndexState = (
  nk: RuntimeNakama,
): { object: RuntimeStorageObject | null; index: TournamentIndexRecord } => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_COLLECTION,
      key: TOURNAMENT_INDEX_KEY,
    },
  ]) as RuntimeStorageObject[];

  const object = findStorageObject(objects, TOURNAMENT_COLLECTION, TOURNAMENT_INDEX_KEY);
  return {
    object,
    index: normalizeTournamentIndexRecord(object?.value ?? null),
  };
};

export const readTournamentObject = (nk: RuntimeNakama, tournamentId: string): RuntimeStorageObject | null => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_COLLECTION,
      key: tournamentId,
    },
  ]) as RuntimeStorageObject[];

  return findStorageObject(objects, TOURNAMENT_COLLECTION, tournamentId);
};

export const readTournamentOrThrow = (nk: RuntimeNakama, tournamentId: string): TournamentRecord => {
  const object = readTournamentObject(nk, tournamentId);
  const tournament = normalizeTournamentRecord(object?.value ?? null, tournamentId);

  if (!object || !tournament) {
    throw new Error(`Tournament '${tournamentId}' was not found.`);
  }

  return tournament;
};

export const readTournamentsByIds = (nk: RuntimeNakama, tournamentIds: string[]): TournamentRecord[] => {
  if (tournamentIds.length === 0) {
    return [];
  }

  const requests = tournamentIds.map((tournamentId) => ({
    collection: TOURNAMENT_COLLECTION,
    key: tournamentId,
  }));
  const objects = nk.storageRead(requests) as RuntimeStorageObject[];

  return tournamentIds
    .map((tournamentId) => {
      const object = findStorageObject(objects, TOURNAMENT_COLLECTION, tournamentId);
      return normalizeTournamentRecord(object?.value ?? null, tournamentId);
    })
    .filter((entry): entry is TournamentRecord => Boolean(entry));
};

export const writeTournamentObject = (
  nk: RuntimeNakama,
  tournament: TournamentRecord,
  version: string,
): void => {
  nk.storageWrite([
    {
      collection: TOURNAMENT_COLLECTION,
      key: tournament.id,
      value: tournament,
      version,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    },
  ]);
};

export const writeTournamentIndexObject = (
  nk: RuntimeNakama,
  index: TournamentIndexRecord,
  version: string,
): void => {
  nk.storageWrite([
    {
      collection: TOURNAMENT_COLLECTION,
      key: TOURNAMENT_INDEX_KEY,
      value: index,
      version,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    },
  ]);
};

export const updateTournamentWithRetry = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  tournamentId: string,
  updater: (current: TournamentRecord) => TournamentRecord,
): TournamentRecord => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const object = readTournamentObject(nk, tournamentId);
    const current = normalizeTournamentRecord(object?.value ?? null, tournamentId);

    if (!object || !current) {
      throw new Error(`Tournament '${tournamentId}' was not found.`);
    }

    const next = updater(current);

    try {
      writeTournamentObject(nk, next, getStorageObjectVersion(object) ?? "");
      return next;
    } catch (error) {
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }

      logger.warn(
        "Retrying tournament write for %s after storage conflict: %s",
        tournamentId,
        getErrorMessage(error),
      );
    }
  }

  throw new Error(`Unable to update tournament '${tournamentId}'.`);
};

export const sortTournamentsByUpdatedAt = (tournaments: TournamentRecord[]): TournamentRecord[] =>
  tournaments.slice().sort((left, right) => {
    const updatedAtCompare = right.updatedAt.localeCompare(left.updatedAt);
    if (updatedAtCompare !== 0) {
      return updatedAtCompare;
    }

    return left.name.localeCompare(right.name);
  });

export const filterTournamentSearch = (tournaments: TournamentRecord[], search: string | null): TournamentRecord[] => {
  if (!search) {
    return tournaments;
  }

  const normalizedSearch = search.trim().toLowerCase();
  if (normalizedSearch.length === 0) {
    return tournaments;
  }

  return tournaments.filter((tournament) => {
    const haystacks = [
      tournament.id,
      tournament.name,
      tournament.region,
      tournament.gameMode,
      tournament.description,
      tournament.tags.join(" "),
    ];

    return haystacks.some((value) => value.toLowerCase().indexOf(normalizedSearch) >= 0);
  });
};

export const createAuditMetadata = (value: RuntimeMetadata | undefined): RuntimeMetadata => {
  const metadata = asRecord(value);
  return metadata ? metadata : {};
};

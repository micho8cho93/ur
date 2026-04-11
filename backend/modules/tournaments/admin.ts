import { listTournamentAuditEntries, runAuditedAdminRpc } from "./audit";
import { assertAdmin } from "./auth";
import {
  assertPowerOfTwoTournamentSize,
  createSingleEliminationBracket,
  getSingleEliminationRoundCount,
  normalizeTournamentBracketState,
  type TournamentBracketParticipant,
  normalizeTournamentRunRegistration,
  type TournamentBracketState,
  type TournamentRunRegistration,
} from "./bracket";
import {
  getActorLabel,
  parseJsonPayload,
  readNumberField,
  resolveTournamentXpRewardSettings,
  readStringField,
  requireAuthenticatedUserId,
  slugify,
} from "./definitions";
import {
  buildTournamentBotDisplayNames,
  buildTournamentBotSummary,
  buildTournamentBotUserId,
  isTournamentBotUserId,
  normalizeTournamentBotPolicy,
} from "../../../shared/tournamentBots";
import {
  MAX_WRITE_ATTEMPTS,
  RuntimeStorageObject,
  STORAGE_PERMISSION_NONE,
  awardXpForTournamentChampion,
  asRecord,
  findStorageObject,
  getErrorMessage,
  getStorageObjectVersion,
  maybeSetStorageVersion,
  type XpRewardResult,
} from "../progression";
import type { RuntimeContext, RuntimeLogger, RuntimeMetadata, RuntimeNakama } from "./types";
import { getTournamentLobbyDeadlineMs } from "../../../shared/tournamentLobby";
import { DEFAULT_BOT_DIFFICULTY } from "../../../logic/bot/types";

type SortOrder = "asc" | "desc";
type Operator = "best" | "set" | "incr";
export type RunLifecycle = "draft" | "open" | "closed" | "finalized";

export type TournamentRunRecord = {
  runId: string;
  tournamentId: string;
  title: string;
  description: string;
  category: number;
  authoritative: boolean;
  sortOrder: SortOrder;
  operator: Operator;
  resetSchedule: string;
  metadata: RuntimeMetadata;
  startTime: number;
  endTime: number;
  duration: number;
  maxSize: number;
  maxNumScore: number;
  joinRequired: boolean;
  enableRanks: boolean;
  lifecycle: RunLifecycle;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  createdByLabel: string;
  openedAt: string | null;
  closedAt: string | null;
  finalizedAt: string | null;
  finalSnapshot: TournamentStandingsSnapshot | null;
  registrations: TournamentRunRegistration[];
  bracket: TournamentBracketState | null;
};

type TournamentRunIndexRecord = {
  runIds: string[];
  updatedAt: string;
};

export type TournamentStandingsSnapshot = {
  generatedAt: string;
  overrideExpiry: number;
  rankCount: number | null;
  records: Record<string, unknown>[];
  prevCursor: string | null;
  nextCursor: string | null;
};

type TournamentRunResponse = TournamentRunRecord & {
  bots: ReturnType<typeof buildTournamentBotSummary>;
};

type TournamentRunListResponseItem = TournamentRunResponse & {
  nakamaTournament: Record<string, unknown> | null;
};

export type FinalizeTournamentRunOptions = {
  limit?: number | null;
  overrideExpiry?: number | null;
};

export type FinalizeTournamentRunResult = {
  run: TournamentRunRecord;
  nakamaTournament: Record<string, unknown> | null;
  finalSnapshot: TournamentStandingsSnapshot;
  disabledRanks: boolean;
  championUserId: string | null;
  championRewardResult: (XpRewardResult & { source: "tournament_champion" }) | null;
};

export const RUNS_COLLECTION = "tournament_runs";
export const RUNS_INDEX_KEY = "index";

export const RPC_ADMIN_LIST_TOURNAMENTS = "rpc_admin_list_tournaments";
export const RPC_ADMIN_GET_TOURNAMENT_RUN = "rpc_admin_get_tournament_run";
export const RPC_ADMIN_CREATE_TOURNAMENT_RUN = "rpc_admin_create_tournament_run";
export const RPC_ADMIN_OPEN_TOURNAMENT = "rpc_admin_open_tournament";
export const RPC_ADMIN_DELETE_TOURNAMENT = "rpc_admin_delete_tournament";
export const RPC_ADMIN_CLOSE_TOURNAMENT = "rpc_admin_close_tournament";
export const RPC_ADMIN_FINALIZE_TOURNAMENT = "rpc_admin_finalize_tournament";
export const RPC_ADMIN_GET_TOURNAMENT_STANDINGS = "rpc_admin_get_tournament_standings";
export const RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG = "rpc_admin_get_tournament_audit_log";

const DEFAULT_CATEGORY = 0;
const DEFAULT_SORT_ORDER: SortOrder = "desc";
const DEFAULT_OPERATOR: Operator = "best";
export const AUTO_TOURNAMENT_DURATION_SECONDS = 18_000;
const DEFAULT_DURATION_SECONDS = AUTO_TOURNAMENT_DURATION_SECONDS;
const DEFAULT_MAX_SIZE = 1024;
const DEFAULT_STANDINGS_LIMIT = 100;
export const MAX_STANDINGS_LIMIT = 10000;
const MAX_RUN_LIST_LIMIT = 100;
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
const TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION = "tournament_run_memberships";
const TOURNAMENT_MATCH_RESULTS_COLLECTION = "tournament_match_results";

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

const readMetadataField = (value: unknown, keys: string[]): RuntimeMetadata => {
  const record = asRecord(value);
  if (!record) {
    return {};
  }

  for (const key of keys) {
    const field = asRecord(record[key]);
    if (field) {
      return field;
    }
  }

  return {};
};

const readStringArrayField = (value: unknown, keys: string[]): string[] => {
  const record = asRecord(value);
  if (!record) {
    return [];
  }

  for (const key of keys) {
    const field = record[key];
    if (!Array.isArray(field)) {
      continue;
    }

    return field.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  }

  return [];
};

const normalizeSortOrder = (value: unknown): SortOrder => {
  if (typeof value === "string" && value.toLowerCase() === "asc") {
    return "asc";
  }

  return "desc";
};

const normalizeOperator = (value: unknown): Operator => {
  if (value === "set" || value === "incr" || value === "best") {
    return value;
  }

  return DEFAULT_OPERATOR;
};

const normalizeRunLifecycle = (value: unknown): RunLifecycle => {
  if (value === "draft" || value === "open" || value === "closed" || value === "finalized") {
    return value;
  }

  return "draft";
};

export const clampInteger = (value: unknown, fallback: number, minimum: number, maximum: number): number => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(minimum, Math.min(maximum, Math.floor(parsed)));
};

const buildRunId = (preferredId: string | null, title: string, existingIds: string[]): string => {
  const existing = new Set(existingIds);
  const base = slugify(preferredId ?? title) || `tournament-run-${Date.now()}`;

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

const normalizeStandingsSnapshot = (value: unknown): TournamentStandingsSnapshot | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const rawRecords = Array.isArray(record.records) ? record.records : [];
  return {
    generatedAt: readStringField(record, ["generatedAt", "generated_at"]) ?? new Date(0).toISOString(),
    overrideExpiry: clampInteger(readNumberField(record, ["overrideExpiry", "override_expiry"]), 0, 0, 2147483647),
    rankCount: (() => {
      const rankCount = readNumberField(record, ["rankCount", "rank_count"]);
      return typeof rankCount === "number" ? rankCount : null;
    })(),
    records: rawRecords.map((entry) => (asRecord(entry) ?? {})),
    prevCursor: readStringField(record, ["prevCursor", "prev_cursor"]),
    nextCursor: readStringField(record, ["nextCursor", "next_cursor"]),
  };
};

export const normalizeRunRecord = (value: unknown, fallbackId?: string): TournamentRunRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const runId = readStringField(record, ["runId", "run_id"]) ?? fallbackId ?? null;
  const tournamentId = readStringField(record, ["tournamentId", "tournament_id"]) ?? runId;
  const title = readStringField(record, ["title"]);
  const createdAt = readStringField(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField(record, ["updatedAt", "updated_at"]);
  const createdByUserId = readStringField(record, ["createdByUserId", "created_by_user_id"]);
  const createdByLabel = readStringField(record, ["createdByLabel", "created_by_label"]);

  if (!runId || !tournamentId || !title || !createdAt || !updatedAt || !createdByUserId || !createdByLabel) {
    return null;
  }

  return {
    runId,
    tournamentId,
    title,
    description: readStringField(record, ["description"]) ?? "",
    category: clampInteger(readNumberField(record, ["category"]), DEFAULT_CATEGORY, 0, 127),
    authoritative: readBooleanField(record, ["authoritative"]) ?? true,
    sortOrder: normalizeSortOrder(readStringField(record, ["sortOrder", "sort_order"]) ?? DEFAULT_SORT_ORDER),
    operator: normalizeOperator(readStringField(record, ["operator"]) ?? DEFAULT_OPERATOR),
    resetSchedule: readStringField(record, ["resetSchedule", "reset_schedule"]) ?? "",
    metadata: readMetadataField(record, ["metadata"]),
    startTime: clampInteger(readNumberField(record, ["startTime", "start_time"]), 0, 0, 2147483647),
    endTime: clampInteger(readNumberField(record, ["endTime", "end_time"]), 0, 0, 2147483647),
    duration: clampInteger(readNumberField(record, ["duration"]), DEFAULT_DURATION_SECONDS, 1, 2147483647),
    maxSize: clampInteger(readNumberField(record, ["maxSize", "max_size"]), DEFAULT_MAX_SIZE, 1, 1000000),
    maxNumScore: clampInteger(
      readNumberField(record, ["maxNumScore", "max_num_score"]),
      1,
      1,
      1000000,
    ),
    joinRequired: readBooleanField(record, ["joinRequired", "join_required"]) ?? true,
    enableRanks: readBooleanField(record, ["enableRanks", "enable_ranks"]) ?? true,
    lifecycle: normalizeRunLifecycle(readStringField(record, ["lifecycle"]) ?? "draft"),
    createdAt,
    updatedAt,
    createdByUserId,
    createdByLabel,
    openedAt: readStringField(record, ["openedAt", "opened_at"]),
    closedAt: readStringField(record, ["closedAt", "closed_at"]),
    finalizedAt: readStringField(record, ["finalizedAt", "finalized_at"]),
    finalSnapshot: normalizeStandingsSnapshot(record.finalSnapshot),
    registrations: Array.isArray(record.registrations)
      ? record.registrations
          .map((entry) => normalizeTournamentRunRegistration(entry))
          .filter((entry): entry is TournamentRunRegistration => Boolean(entry))
      : [],
    bracket: normalizeTournamentBracketState(record.bracket),
  };
};

const normalizeRunIndex = (value: unknown): TournamentRunIndexRecord => {
  const record = asRecord(value);
  const runIds = Array.isArray(record?.runIds) ? record?.runIds : [];

  return {
    runIds: Array.from(
      new Set(runIds.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)),
    ),
    updatedAt: readStringField(record, ["updatedAt", "updated_at"]) ?? new Date(0).toISOString(),
  };
};

export const readRunIndexState = (
  nk: RuntimeNakama,
): { object: RuntimeStorageObject | null; index: TournamentRunIndexRecord } => {
  const objects = nk.storageRead([
    {
      collection: RUNS_COLLECTION,
      key: RUNS_INDEX_KEY,
    },
  ]) as RuntimeStorageObject[];

  const object = findStorageObject(objects, RUNS_COLLECTION, RUNS_INDEX_KEY);
  return {
    object,
    index: normalizeRunIndex(object?.value ?? null),
  };
};

export const readRunObject = (nk: RuntimeNakama, runId: string): RuntimeStorageObject | null => {
  const objects = nk.storageRead([
    {
      collection: RUNS_COLLECTION,
      key: runId,
    },
  ]) as RuntimeStorageObject[];

  return findStorageObject(objects, RUNS_COLLECTION, runId);
};

export const readRunOrThrow = (nk: RuntimeNakama, runId: string): TournamentRunRecord => {
  const object = readRunObject(nk, runId);
  const run = normalizeRunRecord(object?.value ?? null, runId);

  if (!object || !run) {
    throw new Error(`Tournament run '${runId}' was not found.`);
  }

  return run;
};

export const readRunsByIds = (nk: RuntimeNakama, runIds: string[]): TournamentRunRecord[] => {
  if (runIds.length === 0) {
    return [];
  }

  const objects = nk.storageRead(
    runIds.map((runId) => ({
      collection: RUNS_COLLECTION,
      key: runId,
    })),
  ) as RuntimeStorageObject[];

  return runIds
    .map((runId) => {
      const object = findStorageObject(objects, RUNS_COLLECTION, runId);
      return normalizeRunRecord(object?.value ?? null, runId);
    })
    .filter((run): run is TournamentRunRecord => Boolean(run));
};

const writeRun = (nk: RuntimeNakama, run: TournamentRunRecord, version?: string | null): void => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: RUNS_COLLECTION,
      key: run.runId,
      value: run,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    }, version),
  ]);
};

const writeRunIndex = (nk: RuntimeNakama, index: TournamentRunIndexRecord, version?: string | null): void => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: RUNS_COLLECTION,
      key: RUNS_INDEX_KEY,
      value: index,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    }, version),
  ]);
};

const isStorageVersionConflict = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("version check") ||
    message.includes("version conflict") ||
    message.includes("version mismatch") ||
    message.includes("storage write rejected") ||
    message.includes("already exists")
  );
};

const getRunObjectVersionOrThrow = (runId: string, object: RuntimeStorageObject): string => {
  const version = getStorageObjectVersion(object);
  if (!version || version.trim().length === 0) {
    throw new Error(
      `Tournament run '${runId}' is missing a storage version and cannot be updated safely.`,
    );
  }

  return version;
};

export const updateRunWithRetry = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  runId: string,
  updater: (current: TournamentRunRecord) => TournamentRunRecord,
): TournamentRunRecord => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const object = readRunObject(nk, runId);
    const current = normalizeRunRecord(object?.value ?? null, runId);

    if (!object || !current) {
      throw new Error(`Tournament run '${runId}' was not found.`);
    }

    const next = updater(current);
    const version = getRunObjectVersionOrThrow(runId, object);

    try {
      writeRun(nk, next, version);
      return next;
    } catch (error) {
      if (!isStorageVersionConflict(error)) {
        throw error;
      }

      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }

      logger.warn(
        "Retrying tournament run write for %s after storage conflict: %s",
        runId,
        getErrorMessage(error),
      );
    }
  }

  throw new Error(`Unable to update tournament run '${runId}'.`);
};

const readTournamentArray = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => asRecord(entry) ?? {}).filter((entry) => Object.keys(entry).length > 0);
  }

  const record = asRecord(value);
  const tournaments = Array.isArray(record?.tournaments) ? record.tournaments : [];
  return tournaments.map((entry) => asRecord(entry) ?? {}).filter((entry) => Object.keys(entry).length > 0);
};

const mapTournamentsById = (value: unknown): Record<string, Record<string, unknown>> => {
  return readTournamentArray(value).reduce<Record<string, Record<string, unknown>>>(
    (accumulator, tournament) => {
      const tournamentId = readStringField(tournament, ["id"]);
      if (tournamentId) {
        accumulator[tournamentId] = tournament;
      }
      return accumulator;
    },
    {} as Record<string, Record<string, unknown>>,
  );
};

export const getNakamaTournamentById = (nk: RuntimeNakama, tournamentId: string): Record<string, unknown> | null => {
  const tournaments = readTournamentArray(nk.tournamentsGetId([tournamentId]));
  return tournaments.length > 0 ? tournaments[0] : null;
};

const getRunEntrantCount = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
): number =>
  Math.max(
    run.registrations.length,
    Math.max(0, Math.floor(readNumberField(nakamaTournament, ["size"]) ?? 0)),
  );

const getRunCapacity = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
): number => Math.max(0, Math.floor(readNumberField(nakamaTournament, ["maxSize", "max_size"]) ?? run.maxSize));

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

const buildRunBotSummary = (run: TournamentRunRecord) =>
  buildTournamentBotSummary(run.metadata, getRunBotUserIds(run));

const buildRunResponseMetadata = (value: unknown): RuntimeMetadata => {
  const baseMetadata = readMetadataField(value, ["metadata"]);
  const explicitAutoAddBots = readBooleanField(value, ["autoAddBots", "auto_add_bots"]);
  const explicitBotDifficulty = readStringField(value, ["botDifficulty", "bot_difficulty"]);
  const normalizedPolicy = normalizeTournamentBotPolicy({
    ...baseMetadata,
    ...(explicitAutoAddBots !== null ? { autoAddBots: explicitAutoAddBots } : {}),
    ...(explicitBotDifficulty !== null ? { botDifficulty: explicitBotDifficulty } : {}),
  });

  return {
    ...baseMetadata,
    autoAddBots: normalizedPolicy.autoAdd,
    botDifficulty:
      normalizedPolicy.autoAdd
        ? normalizedPolicy.difficulty ?? DEFAULT_BOT_DIFFICULTY
        : null,
  };
};

const buildTournamentRunResponse = (run: TournamentRunRecord): TournamentRunResponse => ({
  ...run,
  bots: buildRunBotSummary(run),
});

const buildTournamentBotRegistrations = (
  runId: string,
  difficulty: string,
  startingSeed: number,
  count: number,
  joinedAt: string,
): TournamentRunRegistration[] => {
  const registrations = Array.from({ length: count }, (_, index) => {
    const seed = startingSeed + index;
    return {
      userId: buildTournamentBotUserId(runId, seed),
      displayName: "",
      joinedAt,
      seed,
    };
  });
  const displayNames = buildTournamentBotDisplayNames(
    registrations.map((registration) => registration.userId),
    difficulty === "easy" || difficulty === "medium" || difficulty === "hard" || difficulty === "perfect"
      ? difficulty
      : DEFAULT_BOT_DIFFICULTY,
  );

  return registrations.map((registration) => ({
    ...registration,
    displayName: displayNames[registration.userId] ?? registration.userId,
  }));
};

const joinTournamentBots = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  tournamentId: string,
  registrations: TournamentRunRegistration[],
): void => {
  registrations.forEach((registration) => {
    try {
      nk.tournamentJoin(tournamentId, registration.userId, registration.displayName);
    } catch (error) {
      const message = getErrorMessage(error);
      if (/already|joined|duplicate|exists|member/i.test(message)) {
        return;
      }

      logger.warn(
        "Unable to join tournament bot %s into %s: %s",
        registration.userId,
        tournamentId,
        message,
      );
    }
  });
};

const isRunAwaitingLobbyFill = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
): boolean => {
  if (
    run.lifecycle !== "open" ||
    Boolean(run.finalizedAt) ||
    Boolean(run.bracket?.finalizedAt) ||
    Boolean(run.bracket)
  ) {
    return false;
  }

  const capacity = getRunCapacity(run, nakamaTournament);
  if (capacity <= 0) {
    return false;
  }

  return getRunEntrantCount(run, nakamaTournament) < capacity;
};

export const hasRunLobbyFillCountdownExpired = (
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
  nowMs = Date.now(),
): boolean => {
  if (!isRunAwaitingLobbyFill(run, nakamaTournament)) {
    return false;
  }

  const deadlineMs = getTournamentLobbyDeadlineMs(run.openedAt);
  return deadlineMs !== null && deadlineMs <= nowMs;
};

export const maybeAutoFinalizeRunForLobbyTimeout = (
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  run: TournamentRunRecord,
  nakamaTournament?: Record<string, unknown> | null,
): TournamentRunRecord => {
  const resolvedTournament =
    nakamaTournament === undefined ? getNakamaTournamentById(nk, run.tournamentId) : nakamaTournament;

  if (!hasRunLobbyFillCountdownExpired(run, resolvedTournament, Date.now())) {
    return run;
  }

  const botPolicy = normalizeTournamentBotPolicy(run.metadata);
  const humanRegistrations = run.registrations.filter((registration) => !isTournamentBotUserId(registration.userId));
  const capacity = getRunCapacity(run, resolvedTournament);
  const missingSeats = Math.max(0, capacity - run.registrations.length);

  if (botPolicy.autoAdd && humanRegistrations.length > 0 && missingSeats > 0) {
    try {
      const filledAt = new Date().toISOString();
      const botRegistrations = buildTournamentBotRegistrations(
        run.runId,
        botPolicy.difficulty ?? DEFAULT_BOT_DIFFICULTY,
        run.registrations.length + 1,
        missingSeats,
        filledAt,
      );
      const updatedRun = updateRunWithRetry(nk, logger, run.runId, (current) => {
        if (current.bracket || current.lifecycle !== "open") {
          return current;
        }

        const currentHumanRegistrations = current.registrations.filter(
          (registration) => !isTournamentBotUserId(registration.userId),
        );
        if (currentHumanRegistrations.length === 0) {
          return current;
        }

        const currentCapacity = getRunCapacity(current, resolvedTournament);
        const currentMissingSeats = Math.max(0, currentCapacity - current.registrations.length);
        if (currentMissingSeats <= 0) {
          return current;
        }

        const currentBotRegistrations = buildTournamentBotRegistrations(
          current.runId,
          botPolicy.difficulty ?? DEFAULT_BOT_DIFFICULTY,
          current.registrations.length + 1,
          currentMissingSeats,
          filledAt,
        );
        const nextRegistrations = current.registrations.concat(currentBotRegistrations);

        return {
          ...current,
          updatedAt: filledAt,
          registrations: nextRegistrations,
          bracket: createSingleEliminationBracket(nextRegistrations, filledAt),
        };
      });

      if (updatedRun.bracket) {
        joinTournamentBots(
          nk,
          logger,
          updatedRun.tournamentId,
          updatedRun.registrations.filter((registration) => isTournamentBotUserId(registration.userId)),
        );
        logger.info(
          "Filled %d tournament bot seats for run %s after the lobby fill countdown expired.",
          botRegistrations.length,
          updatedRun.runId,
        );
        return updatedRun;
      }
    } catch (error) {
      logger.warn(
        "Unable to fill tournament run %s with bots after the lobby fill countdown expired: %s",
        run.runId,
        getErrorMessage(error),
      );
      return readRunOrThrow(nk, run.runId);
    }
  }

  try {
    const result = finalizeTournamentRun(logger, nk, run.runId, {});
    logger.info(
      "Auto-finalized tournament run %s after the lobby fill countdown expired.",
      result.run.runId,
    );
    return result.run;
  } catch (error) {
    logger.warn(
      "Unable to auto-finalize tournament run %s after the lobby fill countdown expired: %s",
      run.runId,
      getErrorMessage(error),
    );
    return readRunOrThrow(nk, run.runId);
  }
};

export const getNakamaTournamentsById = (
  nk: RuntimeNakama,
  tournamentIds: string[],
): Record<string, Record<string, unknown>> => {
  const filteredIds = Array.from(new Set(tournamentIds.filter((id) => id.length > 0)));
  if (filteredIds.length === 0) {
    return {};
  }

  return mapTournamentsById(nk.tournamentsGetId(filteredIds));
};

export const readTournamentRecordList = (value: unknown): {
  records: Record<string, unknown>[];
  ownerRecords: Record<string, unknown>[];
  prevCursor: string | null;
  nextCursor: string | null;
  rankCount: number | null;
} => {
  const record = asRecord(value);
  const records = Array.isArray(record?.records) ? record.records : [];
  const ownerRecords = Array.isArray(record?.owner_records)
    ? record.owner_records
    : Array.isArray(record?.ownerRecords)
      ? record.ownerRecords
      : [];

  return {
    records: records.map((entry) => asRecord(entry) ?? {}),
    ownerRecords: ownerRecords.map((entry) => asRecord(entry) ?? {}),
    prevCursor: readStringField(record, ["prev_cursor", "prevCursor"]),
    nextCursor: readStringField(record, ["next_cursor", "nextCursor"]),
    rankCount: (() => {
      const parsed = readNumberField(record, ["rank_count", "rankCount"]);
      return typeof parsed === "number" ? parsed : null;
    })(),
  };
};

export const resolveOverrideExpiry = (overrideExpiry: number | null, tournament: Record<string, unknown> | null): number => {
  if (typeof overrideExpiry === "number" && Number.isFinite(overrideExpiry) && overrideExpiry >= 0) {
    return Math.floor(overrideExpiry);
  }

  if (tournament) {
    const endTime = readNumberField(tournament, ["end_time", "endTime"]);
    if (typeof endTime === "number" && endTime > 0) {
      return Math.floor(endTime);
    }
  }

  return 0;
};

export const buildStandingsSnapshot = (
  nk: RuntimeNakama,
  tournamentId: string,
  limit: number,
  overrideExpiry: number,
): TournamentStandingsSnapshot => {
  const result = readTournamentRecordList(
    nk.tournamentRecordsList(tournamentId, [], limit, "", overrideExpiry),
  );

  return {
    generatedAt: new Date().toISOString(),
    overrideExpiry,
    rankCount: result.rankCount,
    records: result.records,
    prevCursor: result.prevCursor,
    nextCursor: result.nextCursor,
  };
};

type ReconstructedTournamentSnapshotPlayer = {
  userId: string;
  username: string | null;
  didWin: boolean;
  score: number;
  finishedCount: number;
};

type ReconstructedTournamentSnapshotMatch = {
  matchId: string;
  completedAt: string;
  round: number | null;
  entryId: string | null;
  players: ReconstructedTournamentSnapshotPlayer[];
};

type ReconstructedTournamentStanding = {
  userId: string;
  username: string;
  score: number;
  subscore: number;
  attempts: number;
  latestCompletedAt: string | null;
  latestRound: number | null;
  latestEntryId: string | null;
  latestMatchId: string | null;
  latestOpponentUserId: string | null;
  lastResult: "win" | "loss" | null;
};

type StoredTournamentMatchSummary = ReconstructedTournamentSnapshotMatch;

type AdminBracketEntryMatchContext = {
  usernamesByUserId: Record<string, string | null>;
  finishedCountsByUserId: Record<string, number>;
};

const normalizeStoredTournamentMatchSummary = (
  value: unknown,
  options?: {
    requireCounted?: boolean;
  },
): StoredTournamentMatchSummary | null => {
  const record = asRecord(value);
  const requireCounted = options?.requireCounted !== false;

  if (!record || (requireCounted && readBooleanField(record, ["counted"]) !== true)) {
    return null;
  }

  const summary = asRecord(record.summary);
  const matchId = readStringField(record, ["matchId", "match_id"]);
  const completedAt =
    readStringField(summary, ["completedAt", "completed_at"]) ??
    readStringField(record, ["updatedAt", "updated_at", "createdAt", "created_at"]);

  if (!summary || !matchId || !completedAt) {
    return null;
  }

  const players = Array.isArray(summary.players)
    ? summary.players
        .map((entry) => {
          const player = asRecord(entry);
          const userId = readStringField(player, ["userId", "user_id"]);

          if (!player || !userId) {
            return null;
          }

          return {
            userId,
            username: readStringField(player, ["username"]),
            didWin: readBooleanField(player, ["didWin"]) === true,
            score: Math.max(0, Math.floor(readNumberField(player, ["score"]) ?? 0)),
            finishedCount: Math.max(
              0,
              Math.floor(readNumberField(player, ["finishedCount", "finished_count"]) ?? 0),
            ),
          };
        })
        .filter((entry): entry is ReconstructedTournamentSnapshotPlayer => Boolean(entry))
    : [];

  if (players.length === 0) {
    return null;
  }

  return {
    matchId,
    completedAt,
    round: (() => {
      const round = readNumberField(summary, ["round"]);
      return typeof round === "number" && Number.isFinite(round) ? Math.max(1, Math.floor(round)) : null;
    })(),
    entryId: readStringField(summary, ["entryId", "entry_id"]),
    players,
  };
};

const normalizeReconstructedTournamentSnapshotMatch = (
  value: unknown,
): ReconstructedTournamentSnapshotMatch | null => {
  return normalizeStoredTournamentMatchSummary(value, { requireCounted: true });
};

const readStoredReconstructedTournamentSnapshotMatches = (
  nk: RuntimeNakama,
  resultIds: string[],
): ReconstructedTournamentSnapshotMatch[] => {
  if (resultIds.length === 0) {
    return [];
  }

  const objects = nk.storageRead(
    resultIds.map((resultId) => ({
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION,
      key: resultId,
    })),
  ) as RuntimeStorageObject[];

  return resultIds
    .map((resultId) =>
      normalizeReconstructedTournamentSnapshotMatch(
        findStorageObject(objects, TOURNAMENT_MATCH_RESULTS_COLLECTION, resultId)?.value ?? null,
      ),
    )
    .filter((entry): entry is ReconstructedTournamentSnapshotMatch => Boolean(entry));
};

const buildAdminBracketEntryMatchContextByMatchId = (
  nk: RuntimeNakama,
  run: TournamentRunRecord,
): Map<string, AdminBracketEntryMatchContext> => {
  const completedEntries = run.bracket?.entries.filter(
    (entry) => entry.status === "completed" && Boolean(entry.matchId),
  ) ?? [];

  if (completedEntries.length === 0) {
    return new Map();
  }

  const resultIds = Array.from(
    new Set(
      completedEntries
        .map((entry) => entry.matchId)
        .filter((matchId): matchId is string => Boolean(matchId))
        .map((matchId) => `${run.runId}:${matchId}`),
    ),
  );

  const objects = nk.storageRead(
    resultIds.map((resultId) => ({
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION,
      key: resultId,
    })),
  ) as RuntimeStorageObject[];

  return new Map(
    resultIds
      .map((resultId) =>
        normalizeStoredTournamentMatchSummary(
          findStorageObject(objects, TOURNAMENT_MATCH_RESULTS_COLLECTION, resultId)?.value ?? null,
          { requireCounted: false },
        ),
      )
      .filter((entry): entry is StoredTournamentMatchSummary => Boolean(entry))
      .map((entry) => [
        entry.matchId,
        {
          usernamesByUserId: entry.players.reduce<Record<string, string | null>>((accumulator, player) => {
            accumulator[player.userId] = player.username?.trim() || null;
            return accumulator;
          }, {}),
          finishedCountsByUserId: entry.players.reduce<Record<string, number>>((accumulator, player) => {
            accumulator[player.userId] = player.finishedCount;
            return accumulator;
          }, {}),
        },
      ]),
  );
};

const buildAdminTournamentRunResponse = (
  nk: RuntimeNakama,
  run: TournamentRunRecord,
) : TournamentRunResponse => {
  const responseRun = buildTournamentRunResponse(run);
  if (!run.bracket) {
    return responseRun;
  }

  const matchContextByMatchId = buildAdminBracketEntryMatchContextByMatchId(nk, run);

  return {
    ...responseRun,
    bracket: {
      ...run.bracket,
      participants: run.bracket.participants.map((participant) => ({ ...participant })),
      entries: run.bracket.entries.map((entry) => {
        const matchContext = entry.matchId ? matchContextByMatchId.get(entry.matchId) : null;

        return {
          ...entry,
          playerAUsername:
            entry.playerAUserId && matchContext
              ? matchContext.usernamesByUserId[entry.playerAUserId] ?? null
              : null,
          playerBUsername:
            entry.playerBUserId && matchContext
              ? matchContext.usernamesByUserId[entry.playerBUserId] ?? null
              : null,
          playerAScore:
            entry.playerAUserId && matchContext
              ? matchContext.finishedCountsByUserId[entry.playerAUserId] ?? null
              : null,
          playerBScore:
            entry.playerBUserId && matchContext
              ? matchContext.finishedCountsByUserId[entry.playerBUserId] ?? null
              : null,
        };
      }),
    },
  };
};

const applyReconstructedStandingUpdate = (
  operator: TournamentRunRecord["operator"],
  standing: ReconstructedTournamentStanding,
  player: ReconstructedTournamentSnapshotPlayer,
): void => {
  if (operator === "incr") {
    standing.score += player.score;
    standing.subscore += player.finishedCount;
    return;
  }

  if (
    operator === "best" &&
    (player.score > standing.score ||
      (player.score === standing.score && player.finishedCount > standing.subscore))
  ) {
    standing.score = player.score;
    standing.subscore = player.finishedCount;
    return;
  }

  if (operator === "set") {
    standing.score = player.score;
    standing.subscore = player.finishedCount;
  }
};

const buildReconstructedFinalStandingsSnapshot = (
  nk: RuntimeNakama,
  run: TournamentRunRecord,
  overrideExpiry: number,
  generatedAt: string,
): TournamentStandingsSnapshot | null => {
  const countedResultIds = readStringArrayField(run.metadata, ["countedResultIds", "counted_result_ids"]);
  if (countedResultIds.length === 0) {
    return null;
  }

  const matches = readStoredReconstructedTournamentSnapshotMatches(nk, countedResultIds);
  if (matches.length !== countedResultIds.length) {
    return null;
  }

  const participants = run.bracket?.participants.length
    ? run.bracket.participants.slice().sort(compareBracketParticipantsForFallbackSnapshot)
    : run.registrations
        .slice()
        .sort((left, right) => {
          if (left.seed !== right.seed) {
            return left.seed - right.seed;
          }

          const joinedCompare = left.joinedAt.localeCompare(right.joinedAt);
          if (joinedCompare !== 0) {
            return joinedCompare;
          }

          return left.userId.localeCompare(right.userId);
        })
        .map((registration) => ({
          userId: registration.userId,
          displayName: registration.displayName,
          joinedAt: registration.joinedAt,
          seed: registration.seed,
          state: "lobby" as const,
          currentRound: null,
          currentEntryId: null,
          activeMatchId: null,
          finalPlacement: null,
          lastResult: null,
          updatedAt: run.updatedAt,
        }));

  const standingsByUserId = participants.reduce<Record<string, ReconstructedTournamentStanding>>(
    (accumulator, participant) => {
      accumulator[participant.userId] = {
        userId: participant.userId,
        username: participant.displayName,
        score: 0,
        subscore: 0,
        attempts: 0,
        latestCompletedAt: null,
        latestRound: null,
        latestEntryId: null,
        latestMatchId: null,
        latestOpponentUserId: null,
        lastResult: participant.lastResult,
      };
      return accumulator;
    },
    {},
  );

  matches.forEach((match) => {
    match.players.forEach((player) => {
      const standing =
        standingsByUserId[player.userId] ??
        (standingsByUserId[player.userId] = {
          userId: player.userId,
          username: player.username?.trim() || player.userId,
          score: 0,
          subscore: 0,
          attempts: 0,
          latestCompletedAt: null,
          latestRound: null,
          latestEntryId: null,
          latestMatchId: null,
          latestOpponentUserId: null,
          lastResult: null,
        });

      standing.attempts += 1;
      if (player.username?.trim()) {
        standing.username = player.username.trim();
      }
      applyReconstructedStandingUpdate(run.operator, standing, player);

      if (!standing.latestCompletedAt || match.completedAt.localeCompare(standing.latestCompletedAt) >= 0) {
        standing.latestCompletedAt = match.completedAt;
        standing.latestRound = match.round;
        standing.latestEntryId = match.entryId;
        standing.latestMatchId = match.matchId;
        standing.latestOpponentUserId =
          match.players.find((candidate) => candidate.userId !== player.userId)?.userId ?? null;
        standing.lastResult = player.didWin ? "win" : "loss";
      }
    });
  });

  const knownParticipantUserIds = new Set(participants.map((participant) => participant.userId));
  const extraParticipants = Object.keys(standingsByUserId)
    .filter((userId) => !knownParticipantUserIds.has(userId))
    .sort((leftUserId, rightUserId) => {
      const left = standingsByUserId[leftUserId];
      const right = standingsByUserId[rightUserId];

      if (left.score !== right.score) {
        return right.score - left.score;
      }

      if (left.subscore !== right.subscore) {
        return right.subscore - left.subscore;
      }

      if (left.attempts !== right.attempts) {
        return right.attempts - left.attempts;
      }

      return left.username.localeCompare(right.username);
    })
    .map((userId) => {
      const standing = standingsByUserId[userId];

      return {
        userId,
        displayName: standing.username,
        joinedAt: run.createdAt,
        seed: Number.MAX_SAFE_INTEGER,
        state: "lobby" as const,
        currentRound: standing.latestRound,
        currentEntryId: standing.latestEntryId,
        activeMatchId: standing.latestMatchId,
        finalPlacement: null,
        lastResult: standing.lastResult,
        updatedAt: standing.latestCompletedAt ?? run.updatedAt,
      };
    });
  const orderedParticipants = participants.concat(extraParticipants);

  const records = orderedParticipants.map((participant, index) => {
    const standing = standingsByUserId[participant.userId] ?? {
      userId: participant.userId,
      username: participant.displayName,
      score: 0,
      subscore: 0,
      attempts: 0,
      latestCompletedAt: null,
      latestRound: null,
      latestEntryId: null,
      latestMatchId: null,
      latestOpponentUserId: null,
      lastResult: participant.lastResult,
    };

    return {
      rank:
        typeof participant.finalPlacement === "number" && Number.isFinite(participant.finalPlacement)
          ? participant.finalPlacement
          : index + 1,
      owner_id: participant.userId,
      username: standing.username || participant.displayName,
      score: standing.score,
      subscore: standing.subscore,
      num_score: standing.attempts,
      max_num_score: run.maxNumScore,
      create_time: run.createdAt,
      update_time: standing.latestCompletedAt ?? participant.updatedAt ?? run.updatedAt ?? generatedAt,
      metadata: {
        state: participant.state,
        round: standing.latestRound ?? participant.currentRound,
        entryId: standing.latestEntryId ?? participant.currentEntryId,
        matchId: standing.latestMatchId ?? participant.activeMatchId,
        activeMatchId: participant.activeMatchId,
        finalPlacement: participant.finalPlacement,
        result: standing.lastResult ?? participant.lastResult,
        seed: participant.seed,
        opponentUserId: standing.latestOpponentUserId,
        completedAt: standing.latestCompletedAt,
      },
    };
  });

  return {
    generatedAt,
    overrideExpiry,
    rankCount: records.length,
    records,
    prevCursor: null,
    nextCursor: null,
  };
};

const canReuseStoredStandingsSnapshot = (
  snapshot: TournamentStandingsSnapshot | null,
  limit: number,
): snapshot is TournamentStandingsSnapshot => {
  if (!snapshot) {
    return false;
  }

  const availableRecords = snapshot.records.length;
  const totalRecords = snapshot.rankCount ?? availableRecords;
  return availableRecords >= Math.min(limit, totalRecords);
};

export const resolveRunStandingsSnapshot = (
  nk: RuntimeNakama,
  run: TournamentRunRecord,
  limit: number,
  overrideExpiry: number,
): TournamentStandingsSnapshot => {
  const reconstructedSnapshot =
    run.lifecycle === "finalized"
      ? buildReconstructedFinalStandingsSnapshot(
          nk,
          run,
          overrideExpiry,
          run.finalSnapshot?.generatedAt ?? new Date().toISOString(),
        )
      : null;

  if (run.lifecycle === "finalized" && canReuseStoredStandingsSnapshot(run.finalSnapshot, limit)) {
    if (
      reconstructedSnapshot &&
      !snapshotMatchesReconstructedCountedData(run.finalSnapshot, reconstructedSnapshot)
    ) {
      return {
        ...reconstructedSnapshot,
        records: reconstructedSnapshot.records.slice(0, limit),
      };
    }

    return {
      ...run.finalSnapshot,
      records: run.finalSnapshot.records.slice(0, limit),
    };
  }

  if (run.lifecycle === "finalized" && reconstructedSnapshot) {
    return {
      ...reconstructedSnapshot,
      records: reconstructedSnapshot.records.slice(0, limit),
    };
  }

  return buildStandingsSnapshot(nk, run.tournamentId, limit, overrideExpiry);
};

const readStandingsRecordRank = (record: Record<string, unknown>): number | null => {
  const rank = readNumberField(record, ["rank"]);
  return typeof rank === "number" && Number.isFinite(rank) ? rank : null;
};

const readStandingsRecordOwnerId = (record: Record<string, unknown>): string | null =>
  readStringField(record, ["ownerId", "owner_id"]);

const readStandingsRecordScore = (record: Record<string, unknown>): number =>
  Math.max(0, Math.floor(readNumberField(record, ["score"]) ?? 0));

const readStandingsRecordSubscore = (record: Record<string, unknown>): number =>
  Math.max(0, Math.floor(readNumberField(record, ["subscore"]) ?? 0));

const readStandingsRecordAttemptCount = (record: Record<string, unknown>): number =>
  Math.max(0, Math.floor(readNumberField(record, ["numScore", "num_score"]) ?? 0));

export const resolveChampionUserId = (snapshot: TournamentStandingsSnapshot): string | null => {
  if (snapshot.records.length === 0) {
    return null;
  }

  const rankedRecords = snapshot.records
    .map((record) => ({
      record,
      rank: readStandingsRecordRank(record),
    }))
    .filter((entry): entry is { record: Record<string, unknown>; rank: number } => entry.rank !== null);

  const championRecord =
    rankedRecords.find((entry) => entry.rank === 1)?.record ??
    rankedRecords.slice().sort((left, right) => left.rank - right.rank)[0]?.record ??
    snapshot.records[0];

  return championRecord ? readStandingsRecordOwnerId(championRecord) : null;
};

const resolveTopRankOwnerId = (
  snapshot: TournamentStandingsSnapshot,
  targetRank: number,
): string | null => {
  const rankedRecords = snapshot.records
    .map((record) => ({
      record,
      rank: readStandingsRecordRank(record),
    }))
    .filter((entry): entry is { record: Record<string, unknown>; rank: number } => entry.rank !== null);

  const matchedRecord = rankedRecords.find((entry) => entry.rank === targetRank)?.record ?? null;
  return matchedRecord ? readStandingsRecordOwnerId(matchedRecord) : null;
};

const snapshotMatchesFinalizedBracket = (
  snapshot: TournamentStandingsSnapshot,
  run: TournamentRunRecord,
): boolean => {
  if (!run.bracket?.finalizedAt || !run.bracket.winnerUserId || !run.bracket.runnerUpUserId) {
    return true;
  }

  const championUserId = resolveTopRankOwnerId(snapshot, 1);
  const runnerUpUserId = resolveTopRankOwnerId(snapshot, 2);

  return championUserId === run.bracket.winnerUserId && runnerUpUserId === run.bracket.runnerUpUserId;
};

const snapshotMatchesReconstructedCountedData = (
  snapshot: TournamentStandingsSnapshot | null,
  reconstructedSnapshot: TournamentStandingsSnapshot,
): boolean => {
  if (!snapshot) {
    return false;
  }

  const actualByUserId = snapshot.records.reduce<Record<string, Record<string, unknown>>>(
    (accumulator, record) => {
      const ownerId = readStandingsRecordOwnerId(record);
      if (ownerId) {
        accumulator[ownerId] = record;
      }
      return accumulator;
    },
    {},
  );

  return reconstructedSnapshot.records.every((expectedRecord) => {
    const ownerId = readStandingsRecordOwnerId(expectedRecord);
    if (!ownerId) {
      return false;
    }

    const actualRecord = actualByUserId[ownerId];
    if (!actualRecord) {
      return false;
    }

    return (
      readStandingsRecordScore(actualRecord) === readStandingsRecordScore(expectedRecord) &&
      readStandingsRecordSubscore(actualRecord) === readStandingsRecordSubscore(expectedRecord) &&
      readStandingsRecordAttemptCount(actualRecord) === readStandingsRecordAttemptCount(expectedRecord)
    );
  });
};

const compareBracketParticipantsForFallbackSnapshot = (
  left: TournamentBracketParticipant,
  right: TournamentBracketParticipant,
): number => {
  const leftPlacement = typeof left.finalPlacement === "number" ? left.finalPlacement : Number.MAX_SAFE_INTEGER;
  const rightPlacement = typeof right.finalPlacement === "number" ? right.finalPlacement : Number.MAX_SAFE_INTEGER;
  if (leftPlacement !== rightPlacement) {
    return leftPlacement - rightPlacement;
  }

  const leftRound = typeof left.currentRound === "number" ? left.currentRound : 0;
  const rightRound = typeof right.currentRound === "number" ? right.currentRound : 0;
  if (leftRound !== rightRound) {
    return rightRound - leftRound;
  }

  if (left.seed !== right.seed) {
    return left.seed - right.seed;
  }

  const joinedCompare = left.joinedAt.localeCompare(right.joinedAt);
  if (joinedCompare !== 0) {
    return joinedCompare;
  }

  return left.userId.localeCompare(right.userId);
};

const buildBracketStandingsFallbackSnapshot = (
  run: TournamentRunRecord,
  overrideExpiry: number,
  generatedAt: string,
): TournamentStandingsSnapshot => {
  const records = (run.bracket?.participants ?? [])
    .slice()
    .sort(compareBracketParticipantsForFallbackSnapshot)
    .map((participant, index) => ({
      rank:
        typeof participant.finalPlacement === "number" && Number.isFinite(participant.finalPlacement)
          ? participant.finalPlacement
          : index + 1,
      owner_id: participant.userId,
      username: participant.displayName,
      score: participant.state === "champion" ? 1 : 0,
      subscore: 0,
      metadata: {
        state: participant.state,
        round: participant.currentRound,
        entryId: participant.currentEntryId,
        activeMatchId: participant.activeMatchId,
        finalPlacement: participant.finalPlacement,
        result: participant.lastResult,
        seed: participant.seed,
      },
    }));

  return {
    generatedAt,
    overrideExpiry,
    rankCount: records.length,
    records,
    prevCursor: null,
    nextCursor: null,
  };
};

export const finalizeTournamentRun = (
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  runId: string,
  options: FinalizeTournamentRunOptions = {},
): FinalizeTournamentRunResult => {
  const runBeforeUpdate = readRunOrThrow(nk, runId);
  const nakamaTournament = getNakamaTournamentById(nk, runBeforeUpdate.tournamentId);
  const standingsLimit = clampInteger(options.limit, DEFAULT_STANDINGS_LIMIT, 1, MAX_STANDINGS_LIMIT);
  const overrideExpiry = resolveOverrideExpiry(options.overrideExpiry ?? null, nakamaTournament);
  const finalizationTimestamp = new Date().toISOString();
  const bracketFallbackSnapshot = buildBracketStandingsFallbackSnapshot(
    runBeforeUpdate,
    overrideExpiry,
    finalizationTimestamp,
  );
  const reconstructedSnapshot = (() => {
    try {
      return buildReconstructedFinalStandingsSnapshot(
        nk,
        runBeforeUpdate,
        overrideExpiry,
        finalizationTimestamp,
      );
    } catch (error) {
      logger.warn(
        "Unable to reconstruct counted-match standings for %s during finalization: %s",
        runBeforeUpdate.runId,
        getErrorMessage(error),
      );
      return null;
    }
  })();
  const finalSnapshot = (() => {
    if (runBeforeUpdate.finalSnapshot) {
      return runBeforeUpdate.finalSnapshot;
    }

    try {
      const standingsSnapshot = buildStandingsSnapshot(
        nk,
        runBeforeUpdate.tournamentId,
        standingsLimit,
        overrideExpiry,
      );

      if (!snapshotMatchesFinalizedBracket(standingsSnapshot, runBeforeUpdate)) {
        if (reconstructedSnapshot && snapshotMatchesFinalizedBracket(reconstructedSnapshot, runBeforeUpdate)) {
          logger.warn(
            "Standings snapshot for %s disagreed with finalized bracket, using counted-match reconstruction.",
            runBeforeUpdate.runId,
          );
          return reconstructedSnapshot;
        }

        logger.warn(
          "Standings snapshot for %s disagreed with finalized bracket, using bracket fallback.",
          runBeforeUpdate.runId,
        );
        return bracketFallbackSnapshot;
      }

      if (
        reconstructedSnapshot &&
        !snapshotMatchesReconstructedCountedData(standingsSnapshot, reconstructedSnapshot)
      ) {
        logger.warn(
          "Standings snapshot for %s looked stale compared with counted match results, using counted-match reconstruction.",
          runBeforeUpdate.runId,
        );
        return reconstructedSnapshot;
      }

      return standingsSnapshot;
    } catch (error) {
      if (reconstructedSnapshot && snapshotMatchesFinalizedBracket(reconstructedSnapshot, runBeforeUpdate)) {
        logger.warn(
          "Unable to build final standings snapshot for %s during finalization, using counted-match reconstruction: %s",
          runBeforeUpdate.runId,
          getErrorMessage(error),
        );
        return reconstructedSnapshot;
      }

      logger.warn(
        "Unable to build final standings snapshot for %s during finalization, using bracket fallback: %s",
        runBeforeUpdate.runId,
        getErrorMessage(error),
      );
      return bracketFallbackSnapshot;
    }
  })();
  let disabledRanks = false;

  try {
    nk.tournamentRanksDisable(runBeforeUpdate.tournamentId);
    disabledRanks = true;
  } catch (error) {
    logger.warn(
      "Unable to disable ranks for %s during finalization: %s",
      runBeforeUpdate.runId,
      String(error),
    );
  }

  const run = updateRunWithRetry(nk, logger, runId, (current) => ({
    ...current,
    lifecycle: "finalized",
    updatedAt: finalizationTimestamp,
    finalizedAt: current.finalizedAt ?? finalizationTimestamp,
    closedAt: current.closedAt ?? finalizationTimestamp,
    finalSnapshot: current.finalSnapshot ?? finalSnapshot,
  }));

  const effectiveSnapshot = run.finalSnapshot ?? finalSnapshot;
  const championUserId = resolveChampionUserId(effectiveSnapshot) ?? run.bracket?.winnerUserId ?? null;
  let championRewardResult: (XpRewardResult & { source: "tournament_champion" }) | null = null;

  if (championUserId && isTournamentBotUserId(championUserId)) {
    logger.info("Skipping tournament champion XP for synthetic bot %s on run %s.", championUserId, run.runId);
  } else if (championUserId) {
    const rewardSettings = resolveTournamentXpRewardSettings(run.metadata);

    if (rewardSettings.xpForTournamentChampion <= 0) {
      logger.info("Skipping tournament champion XP for %s because the configured reward is zero.", run.runId);
    } else {
      try {
        championRewardResult = awardXpForTournamentChampion(nk, logger, {
          userId: championUserId,
          runId: run.runId,
          awardedXp: rewardSettings.xpForTournamentChampion,
        });

        if (!championRewardResult.duplicate) {
          logger.info(
            "Awarded tournament champion XP to %s for run %s. total=%d",
            championUserId,
            run.runId,
            championRewardResult.newTotalXp,
          );
        }
      } catch (error) {
        logger.warn(
          "Unable to award tournament champion XP for %s to %s: %s",
          run.runId,
          championUserId,
          getErrorMessage(error),
        );
      }
    }
  } else if (effectiveSnapshot.records.length > 0) {
    logger.warn("Unable to resolve champion user ID for finalized tournament %s.", run.runId);
  }

  return {
    run,
    nakamaTournament,
    finalSnapshot: effectiveSnapshot,
    disabledRanks,
    championUserId,
    championRewardResult,
  };
};

export const sortRuns = (runs: TournamentRunRecord[]): TournamentRunRecord[] =>
  runs.slice().sort((left, right) => {
    const updatedCompare = right.updatedAt.localeCompare(left.updatedAt);
    if (updatedCompare !== 0) {
      return updatedCompare;
    }

    return left.runId.localeCompare(right.runId);
  });

const buildRunResponse = (
  nk: RuntimeNakama,
  run: TournamentRunRecord,
  nakamaTournament: Record<string, unknown> | null,
) => ({
  ok: true,
  run: buildAdminTournamentRunResponse(nk, run),
  nakamaTournament,
});

const maybeAutoFinalizeAdminRun = (
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  run: TournamentRunRecord,
): TournamentRunRecord => {
  const maybeTimedOutRun = maybeAutoFinalizeRunForLobbyTimeout(logger, nk, run);
  if (maybeTimedOutRun.lifecycle === "finalized" || !maybeTimedOutRun.bracket?.finalizedAt) {
    return maybeTimedOutRun;
  }

  try {
    return finalizeTournamentRun(logger, nk, maybeTimedOutRun.runId, {}).run;
  } catch (error) {
    logger.warn(
      "Unable to auto-finalize admin tournament run %s while serving internals: %s",
      maybeTimedOutRun.runId,
      getErrorMessage(error),
    );
    return readRunOrThrow(nk, maybeTimedOutRun.runId);
  }
};

const deleteRunWithRetry = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  run: TournamentRunRecord,
): TournamentRunRecord => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const indexState = readRunIndexState(nk);
    const nextIndex: TournamentRunIndexRecord = {
      runIds: indexState.index.runIds.filter((entry) => entry !== run.runId),
      updatedAt: new Date().toISOString(),
    };

    try {
      nk.storageDelete([
        {
          collection: RUNS_COLLECTION,
          key: run.runId,
        },
        {
          collection: "tournament_match_queue",
          key: run.runId,
          userId: SYSTEM_USER_ID,
        },
        ...run.registrations.map((registration) => ({
          collection: TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION,
          key: run.runId,
          userId: registration.userId,
        })),
      ]);
      writeRunIndex(nk, nextIndex, getStorageObjectVersion(indexState.object));
      return run;
    } catch (error) {
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }

      logger.warn(
        "Retrying tournament run delete for %s after storage conflict: %s",
        run.runId,
        getErrorMessage(error),
      );
    }
  }

  throw new Error(`Unable to delete tournament run '${run.runId}'.`);
};

export const rpcAdminListTournaments = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "viewer", _nk);
      const parsed = parseJsonPayload(_payload);
      const limit = clampInteger(parsed.limit, 50, 1, MAX_RUN_LIST_LIMIT);
      const lifecycleFilter = readStringField(parsed, ["lifecycle"]);

      const indexState = readRunIndexState(_nk);
      const runs = sortRuns(readRunsByIds(_nk, indexState.index.runIds).map((run) =>
        maybeAutoFinalizeAdminRun(_logger, _nk, run),
      ));
      const filteredRuns =
        lifecycleFilter && (lifecycleFilter === "draft" || lifecycleFilter === "open" || lifecycleFilter === "closed" || lifecycleFilter === "finalized")
          ? runs.filter((run) => run.lifecycle === lifecycleFilter)
          : runs;
      const limitedRuns = filteredRuns.slice(0, limit);
      const tournamentsById = getNakamaTournamentsById(
        _nk,
        limitedRuns.map((run) => run.tournamentId),
      );
      const items: TournamentRunListResponseItem[] = limitedRuns.map((run) => ({
        ...buildAdminTournamentRunResponse(_nk, run),
        nakamaTournament: tournamentsById[run.tournamentId] ?? null,
      }));

      return JSON.stringify({
        ok: true,
        runs: items,
        totalCount: filteredRuns.length,
      });
    },
    {
      action: RPC_ADMIN_LIST_TOURNAMENTS,
      targetId: "tournament_runs",
      targetName: "Tournament runs",
    },
    ctx,
    logger,
    nk,
    payload,
  );
};

export const rpcAdminGetTournamentRun = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "viewer", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);

      if (!runId) {
        throw new Error("runId is required.");
      }

      const existingRun = normalizeRunRecord(readRunObject(_nk, runId)?.value ?? null, runId);
      const run = existingRun ? maybeAutoFinalizeAdminRun(_logger, _nk, existingRun) : null;
      if (!run) {
        return JSON.stringify({
          ok: true,
          run: null,
          nakamaTournament: null,
        });
      }

      const nakamaTournament = getNakamaTournamentById(_nk, run.tournamentId);

      return JSON.stringify({
        ok: true,
        run: buildAdminTournamentRunResponse(_nk, run),
        nakamaTournament,
      });
    },
    {
      action: RPC_ADMIN_GET_TOURNAMENT_RUN,
    },
    ctx,
    logger,
    nk,
    payload,
  );
};

export const rpcAdminCreateTournamentRun = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "operator", _nk);
      const parsed = parseJsonPayload(_payload);
      const title = readStringField(parsed, ["title"]);

      if (!title) {
        throw new Error("title is required.");
      }

      for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
        const indexState = readRunIndexState(_nk);
        const createdAt = new Date().toISOString();
        const runId = buildRunId(
          readStringField(parsed, ["runId", "run_id"]),
          title,
          indexState.index.runIds,
        );
        const startTime = clampInteger(readNumberField(parsed, ["startTime", "start_time"]), 0, 0, 2147483647);
        const maxSize = clampInteger(readNumberField(parsed, ["maxSize", "max_size"]), DEFAULT_MAX_SIZE, 1, 1000000);
        assertPowerOfTwoTournamentSize(maxSize);
        const duration = AUTO_TOURNAMENT_DURATION_SECONDS;
        const maxNumScore = getSingleEliminationRoundCount(maxSize);
        const endTime = startTime > 0 ? startTime + duration : 0;
        const run: TournamentRunRecord = {
          runId,
          tournamentId: runId,
          title,
          description: readStringField(parsed, ["description"]) ?? "",
          category: clampInteger(readNumberField(parsed, ["category"]), DEFAULT_CATEGORY, 0, 127),
          authoritative: readBooleanField(parsed, ["authoritative"]) ?? true,
          sortOrder: normalizeSortOrder(readStringField(parsed, ["sortOrder", "sort_order"])),
          operator: normalizeOperator(readStringField(parsed, ["operator"])),
          resetSchedule: readStringField(parsed, ["resetSchedule", "reset_schedule"]) ?? "",
          metadata: buildRunResponseMetadata(parsed),
          startTime,
          endTime,
          duration,
          maxSize,
          maxNumScore,
          joinRequired: readBooleanField(parsed, ["joinRequired", "join_required"]) ?? true,
          enableRanks: readBooleanField(parsed, ["enableRanks", "enable_ranks"]) ?? true,
          lifecycle: "draft",
          createdAt,
          updatedAt: createdAt,
          createdByUserId: requireAuthenticatedUserId(_ctx),
          createdByLabel: getActorLabel(_ctx),
          openedAt: null,
          closedAt: null,
          finalizedAt: null,
          finalSnapshot: null,
          registrations: [],
          bracket: null,
        };
        const nextIndex: TournamentRunIndexRecord = {
          runIds: [run.runId].concat(indexState.index.runIds),
          updatedAt: createdAt,
        };

        try {
          _nk.storageWrite([
            maybeSetStorageVersion({
              collection: RUNS_COLLECTION,
              key: run.runId,
              value: run,
              permissionRead: STORAGE_PERMISSION_NONE,
              permissionWrite: STORAGE_PERMISSION_NONE,
            }, null),
            maybeSetStorageVersion({
              collection: RUNS_COLLECTION,
              key: RUNS_INDEX_KEY,
              value: nextIndex,
              permissionRead: STORAGE_PERMISSION_NONE,
              permissionWrite: STORAGE_PERMISSION_NONE,
            }, getStorageObjectVersion(indexState.object)),
          ]);

          return JSON.stringify(buildRunResponse(_nk, run, null));
        } catch (error) {
          if (attempt === MAX_WRITE_ATTEMPTS) {
            throw error;
          }

          _logger.warn("Retrying tournament run create for %s: %s", title, getErrorMessage(error));
        }
      }

      throw new Error("Unable to create tournament run.");
    },
    {
      action: RPC_ADMIN_CREATE_TOURNAMENT_RUN,
    },
    ctx,
    logger,
    nk,
    payload,
  );
};

export const rpcAdminOpenTournament = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "operator", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);

      if (!runId) {
        throw new Error("runId is required.");
      }

      let createdTournament = false;
      const run = updateRunWithRetry(_nk, _logger, runId, (current) => {
        assertPowerOfTwoTournamentSize(current.maxSize);

        if (current.lifecycle === "finalized") {
          throw new Error("A finalized tournament run cannot be reopened.");
        }

        if (current.lifecycle === "draft") {
          const existingTournament = getNakamaTournamentById(_nk, current.tournamentId);
          if (!existingTournament) {
            _nk.tournamentCreate(
              current.tournamentId,
              current.authoritative,
              current.sortOrder,
              current.operator,
              current.duration,
              current.resetSchedule,
              current.metadata,
              current.title,
              current.description,
              current.category,
              current.startTime,
              current.endTime,
              current.maxSize,
              current.maxNumScore,
              current.joinRequired,
              current.enableRanks,
            );
            createdTournament = true;
          }
        }

        if (current.lifecycle === "open") {
          return current;
        }

        const updatedAt = new Date().toISOString();
        return {
          ...current,
          lifecycle: "open",
          updatedAt,
          openedAt: current.openedAt ?? updatedAt,
          closedAt: null,
        };
      });

      return JSON.stringify(buildRunResponse(_nk, run, getNakamaTournamentById(_nk, run.tournamentId)));
    },
    {
      action: RPC_ADMIN_OPEN_TOURNAMENT,
    },
    ctx,
    logger,
    nk,
    payload,
  );
};

export const rpcAdminDeleteTournament = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "admin", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);

      if (!runId) {
        throw new Error("runId is required.");
      }

      const run = readRunOrThrow(_nk, runId);
      let deletedNakamaTournament = false;

      if (getNakamaTournamentById(_nk, run.tournamentId)) {
        try {
          _nk.tournamentDelete(run.tournamentId);
          deletedNakamaTournament = true;
        } catch (error) {
          _logger.warn(
            "Unable to delete Nakama tournament %s for run %s: %s",
            run.tournamentId,
            run.runId,
            getErrorMessage(error),
          );
        }
      }

      deleteRunWithRetry(_nk, _logger, run);

      return JSON.stringify({
        ok: true,
        deleted: true,
        deletedNakamaTournament,
        run,
        nakamaTournament: null,
      });
    },
    {
      action: RPC_ADMIN_DELETE_TOURNAMENT,
    },
    ctx,
    logger,
    nk,
    payload,
  );
};

export const rpcAdminCloseTournament = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "operator", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);

      if (!runId) {
        throw new Error("runId is required.");
      }

      const run = updateRunWithRetry(_nk, _logger, runId, (current) => {
        if (current.lifecycle === "finalized") {
          throw new Error("A finalized tournament run cannot be closed.");
        }

        if (current.lifecycle === "closed") {
          return current;
        }

        const updatedAt = new Date().toISOString();
        return {
          ...current,
          lifecycle: "closed",
          updatedAt,
          closedAt: current.closedAt ?? updatedAt,
        };
      });

      return JSON.stringify(buildRunResponse(_nk, run, getNakamaTournamentById(_nk, run.tournamentId)));
    },
    {
      action: RPC_ADMIN_CLOSE_TOURNAMENT,
    },
    ctx,
    logger,
    nk,
    payload,
  );
};

export const rpcAdminFinalizeTournament = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "admin", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);

      if (!runId) {
        throw new Error("runId is required.");
      }

      const finalized = finalizeTournamentRun(_logger, _nk, runId, {
        limit: readNumberField(parsed, ["limit"]),
        overrideExpiry: readNumberField(parsed, ["overrideExpiry", "override_expiry"]),
      });

      return JSON.stringify({
        ok: true,
        run: finalized.run,
        nakamaTournament: finalized.nakamaTournament,
        finalSnapshot: finalized.finalSnapshot,
        disabledRanks: finalized.disabledRanks,
      });
    },
    {
      action: RPC_ADMIN_FINALIZE_TOURNAMENT,
    },
    ctx,
    logger,
    nk,
    payload,
  );
};

export const rpcAdminGetTournamentStandings = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "viewer", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);

      if (!runId) {
        throw new Error("runId is required.");
      }

      const run = maybeAutoFinalizeAdminRun(_logger, _nk, readRunOrThrow(_nk, runId));
      const nakamaTournament = getNakamaTournamentById(_nk, run.tournamentId);
      const limit = clampInteger(parsed.limit, DEFAULT_STANDINGS_LIMIT, 1, MAX_STANDINGS_LIMIT);
      const overrideExpiry = resolveOverrideExpiry(
        readNumberField(parsed, ["overrideExpiry", "override_expiry"]),
        nakamaTournament,
      );
      const standings = resolveRunStandingsSnapshot(_nk, run, limit, overrideExpiry);

      return JSON.stringify({
        ok: true,
        run,
        nakamaTournament,
        standings,
      });
    },
    {
      action: RPC_ADMIN_GET_TOURNAMENT_STANDINGS,
    },
    ctx,
    logger,
    nk,
    payload,
  );
};

export const rpcAdminGetTournamentAuditLog = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "viewer", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);

      if (!runId) {
        throw new Error("runId is required.");
      }

      const run = readRunOrThrow(_nk, runId);
      const limit = clampInteger(parsed.limit, 100, 1, 500);
      const entries = listTournamentAuditEntries(_nk, {
        tournamentId: run.runId,
        limit,
      });

      return JSON.stringify({
        ok: true,
        runId: run.runId,
        tournamentId: run.tournamentId,
        entries,
      });
    },
    {
      action: RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG,
      targetName: "Tournament audit log",
    },
    ctx,
    logger,
    nk,
    payload,
  );
};

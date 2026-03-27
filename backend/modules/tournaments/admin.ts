import { listTournamentAuditEntries, runAuditedAdminRpc } from "./audit";
import { assertAdmin } from "./auth";
import {
  getActorLabel,
  parseJsonPayload,
  readNumberField,
  readStringField,
  requireAuthenticatedUserId,
  slugify,
} from "./definitions";
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
import type { RuntimeContext, RuntimeLogger, RuntimeMetadata, RuntimeNakama } from "./types";

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

type TournamentRunListItem = TournamentRunRecord & {
  nakamaTournament: Record<string, unknown> | null;
};

export const RUNS_COLLECTION = "tournament_runs";
export const RUNS_INDEX_KEY = "index";

export const RPC_ADMIN_LIST_TOURNAMENTS = "rpc_admin_list_tournaments";
export const RPC_ADMIN_GET_TOURNAMENT_RUN = "rpc_admin_get_tournament_run";
export const RPC_ADMIN_CREATE_TOURNAMENT_RUN = "rpc_admin_create_tournament_run";
export const RPC_ADMIN_OPEN_TOURNAMENT = "rpc_admin_open_tournament";
export const RPC_ADMIN_CLOSE_TOURNAMENT = "rpc_admin_close_tournament";
export const RPC_ADMIN_FINALIZE_TOURNAMENT = "rpc_admin_finalize_tournament";
export const RPC_ADMIN_GET_TOURNAMENT_STANDINGS = "rpc_admin_get_tournament_standings";
export const RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG = "rpc_admin_get_tournament_audit_log";

const DEFAULT_CATEGORY = 0;
const DEFAULT_SORT_ORDER: SortOrder = "desc";
const DEFAULT_OPERATOR: Operator = "best";
const DEFAULT_DURATION_SECONDS = 3600;
const DEFAULT_MAX_SIZE = 1024;
const DEFAULT_MAX_NUM_SCORE = 3;
const DEFAULT_STANDINGS_LIMIT = 100;
export const MAX_STANDINGS_LIMIT = 10000;
const MAX_RUN_LIST_LIMIT = 100;

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
      DEFAULT_MAX_NUM_SCORE,
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

const updateRunWithRetry = (
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

    try {
      writeRun(nk, next, getStorageObjectVersion(object) ?? "");
      return next;
    } catch (error) {
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

export const sortRuns = (runs: TournamentRunRecord[]): TournamentRunRecord[] =>
  runs.slice().sort((left, right) => {
    const updatedCompare = right.updatedAt.localeCompare(left.updatedAt);
    if (updatedCompare !== 0) {
      return updatedCompare;
    }

    return left.runId.localeCompare(right.runId);
  });

const buildRunResponse = (run: TournamentRunRecord, nakamaTournament: Record<string, unknown> | null) => ({
  ok: true,
  run,
  nakamaTournament,
});

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
      const runs = sortRuns(readRunsByIds(_nk, indexState.index.runIds));
      const filteredRuns =
        lifecycleFilter && (lifecycleFilter === "draft" || lifecycleFilter === "open" || lifecycleFilter === "closed" || lifecycleFilter === "finalized")
          ? runs.filter((run) => run.lifecycle === lifecycleFilter)
          : runs;
      const limitedRuns = filteredRuns.slice(0, limit);
      const tournamentsById = getNakamaTournamentsById(
        _nk,
        limitedRuns.map((run) => run.tournamentId),
      );
      const items: TournamentRunListItem[] = limitedRuns.map((run) => ({
        ...run,
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

      const run = normalizeRunRecord(readRunObject(_nk, runId)?.value ?? null, runId);
      if (!run) {
        return JSON.stringify({
          ok: true,
          run: null,
          nakamaTournament: null,
        });
      }

      const nakamaTournament = getNakamaTournamentById(_nk, run.tournamentId);

      return JSON.stringify(buildRunResponse(run, nakamaTournament));
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
          metadata: readMetadataField(parsed, ["metadata"]),
          startTime: clampInteger(readNumberField(parsed, ["startTime", "start_time"]), 0, 0, 2147483647),
          endTime: clampInteger(readNumberField(parsed, ["endTime", "end_time"]), 0, 0, 2147483647),
          duration: clampInteger(readNumberField(parsed, ["duration"]), DEFAULT_DURATION_SECONDS, 1, 2147483647),
          maxSize: clampInteger(readNumberField(parsed, ["maxSize", "max_size"]), DEFAULT_MAX_SIZE, 1, 1000000),
          maxNumScore: clampInteger(
            readNumberField(parsed, ["maxNumScore", "max_num_score"]),
            DEFAULT_MAX_NUM_SCORE,
            1,
            1000000,
          ),
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
            }),
            maybeSetStorageVersion({
              collection: RUNS_COLLECTION,
              key: RUNS_INDEX_KEY,
              value: nextIndex,
              permissionRead: STORAGE_PERMISSION_NONE,
              permissionWrite: STORAGE_PERMISSION_NONE,
            }, getStorageObjectVersion(indexState.object)),
          ]);

          return JSON.stringify(buildRunResponse(run, null));
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

      return JSON.stringify(buildRunResponse(run, getNakamaTournamentById(_nk, run.tournamentId)));
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

      return JSON.stringify(buildRunResponse(run, getNakamaTournamentById(_nk, run.tournamentId)));
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

      const runBeforeUpdate = readRunOrThrow(_nk, runId);
      const nakamaTournament = getNakamaTournamentById(_nk, runBeforeUpdate.tournamentId);
      const standingsLimit = clampInteger(parsed.limit, DEFAULT_STANDINGS_LIMIT, 1, MAX_STANDINGS_LIMIT);
      const overrideExpiry = resolveOverrideExpiry(
        readNumberField(parsed, ["overrideExpiry", "override_expiry"]),
        nakamaTournament,
      );
      const finalSnapshot = buildStandingsSnapshot(_nk, runBeforeUpdate.tournamentId, standingsLimit, overrideExpiry);
      let disabledRanks = false;

      try {
        _nk.tournamentRanksDisable(runBeforeUpdate.tournamentId);
        disabledRanks = true;
      } catch (error) {
        _logger.warn("Unable to disable ranks for %s during finalization: %s", runBeforeUpdate.runId, String(error));
      }

      const run = updateRunWithRetry(_nk, _logger, runId, (current) => ({
        ...current,
        lifecycle: "finalized",
        updatedAt: new Date().toISOString(),
        finalizedAt: current.finalizedAt ?? new Date().toISOString(),
        closedAt: current.closedAt ?? new Date().toISOString(),
        finalSnapshot,
      }));

      return JSON.stringify({
        ok: true,
        run,
        nakamaTournament,
        finalSnapshot,
        disabledRanks,
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

      const run = readRunOrThrow(_nk, runId);
      const nakamaTournament = getNakamaTournamentById(_nk, run.tournamentId);
      const limit = clampInteger(parsed.limit, DEFAULT_STANDINGS_LIMIT, 1, MAX_STANDINGS_LIMIT);
      const overrideExpiry = resolveOverrideExpiry(
        readNumberField(parsed, ["overrideExpiry", "override_expiry"]),
        nakamaTournament,
      );
      const standings = buildStandingsSnapshot(_nk, run.tournamentId, limit, overrideExpiry);

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

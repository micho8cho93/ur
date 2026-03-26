import {
  DEFAULT_AUDIT_LIMIT,
  MAX_AUDIT_LIMIT,
  MAX_AUDIT_LOG_ENTRIES,
  RPC_TOURNAMENT_AUDIT_LOG,
  TOURNAMENT_AUDIT_COLLECTION,
  TOURNAMENT_AUDIT_LOG_KEY,
  clampListLimit,
  getActorLabel,
  parseJsonPayload,
  readStringField,
  requireAuthenticatedUserId,
} from "./definitions";
import { assertAdmin } from "./auth";
import { RuntimeStorageObject, STORAGE_PERMISSION_NONE, asRecord, findStorageObject, getErrorMessage, getStorageObjectVersion } from "../progression";
import type {
  RuntimeContext,
  RuntimeLogger,
  RuntimeMetadata,
  RuntimeNakama,
  TournamentAuditEntry,
  TournamentAuditLogRecord,
  TournamentAuditLogRpcRequest,
  TournamentAuditLogRpcResponse,
} from "./types";

type AuditTarget = {
  id: string;
  name?: string | null;
};

type AdminRpcHandler = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
) => string;

type AuditedAdminRpcOptions = {
  action: string;
  targetId?: string | ((ctx: RuntimeContext, payload: Record<string, unknown>, response: Record<string, unknown> | null) => string | null);
  targetName?: string | ((ctx: RuntimeContext, payload: Record<string, unknown>, response: Record<string, unknown> | null) => string | null);
  failureAction?: string;
};

const normalizeAuditValue = (value: unknown, depth = 0): unknown => {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value.length > 160 ? `${value.slice(0, 157)}...` : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 5).map((entry) => normalizeAuditValue(entry, depth + 1));
  }

  const record = asRecord(value);
  if (!record) {
    return undefined;
  }

  if (depth >= 1) {
    const compact: RuntimeMetadata = {};
    Object.keys(record)
      .slice(0, 5)
      .forEach((key) => {
        const normalized = normalizeAuditValue(record[key], depth + 1);
        if (normalized !== undefined) {
          compact[key] = normalized;
        }
      });
    return compact;
  }

  const nested: RuntimeMetadata = {};
  Object.keys(record)
    .slice(0, 10)
    .forEach((key) => {
      const normalized = normalizeAuditValue(record[key], depth + 1);
      if (normalized !== undefined) {
        nested[key] = normalized;
      }
    });
  return nested;
};

export const createAuditPayloadSummary = (value: unknown): RuntimeMetadata => {
  const record = asRecord(value);
  if (!record) {
    return {};
  }

  const summary: RuntimeMetadata = {};
  Object.keys(record)
    .slice(0, 12)
    .forEach((key) => {
      const normalized = normalizeAuditValue(record[key]);
      if (normalized !== undefined) {
        summary[key] = normalized;
      }
    });

  return summary;
};

const normalizeAuditEntry = (value: unknown): TournamentAuditEntry | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = readStringField(record, ["id"]);
  const action = readStringField(record, ["action"]);
  const userId = readStringField(record, ["userId", "user_id", "actorUserId", "actor_user_id"]);
  const targetId = readStringField(record, ["targetId", "target_id", "tournamentId", "tournament_id"]);
  const timestamp = readStringField(record, ["timestamp", "createdAt", "created_at"]);

  if (!id || !action || !userId || !targetId || !timestamp) {
    return null;
  }

  const payloadSummary =
    asRecord(record.payloadSummary) ??
    asRecord(record.payload_summary) ??
    asRecord(record.metadata) ??
    {};
  const actorLabel = readStringField(record, ["actorLabel", "actor_label"]) ?? userId;
  const tournamentName =
    readStringField(record, ["tournamentName", "tournament_name"]) ??
    readStringField(record, ["targetName", "target_name"]) ??
    targetId;

  return {
    id,
    userId,
    action,
    targetId,
    timestamp,
    payloadSummary,
    actorUserId: userId,
    actorLabel,
    tournamentId: targetId,
    tournamentName,
    createdAt: timestamp,
    metadata: payloadSummary,
  };
};

const normalizeAuditLogRecord = (value: unknown): TournamentAuditLogRecord => {
  const record = asRecord(value);
  const entries = Array.isArray(record?.entries)
    ? record.entries
        .map((entry) => normalizeAuditEntry(entry))
        .filter((entry): entry is TournamentAuditEntry => Boolean(entry))
    : [];

  return {
    entries,
    updatedAt: readStringField(record, ["updatedAt", "updated_at"]) ?? new Date(0).toISOString(),
  };
};

const readAuditLogState = (
  nk: RuntimeNakama,
): { object: RuntimeStorageObject | null; log: TournamentAuditLogRecord } => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_AUDIT_COLLECTION,
      key: TOURNAMENT_AUDIT_LOG_KEY,
    },
  ]) as RuntimeStorageObject[];

  const object = findStorageObject(objects, TOURNAMENT_AUDIT_COLLECTION, TOURNAMENT_AUDIT_LOG_KEY);
  return {
    object,
    log: normalizeAuditLogRecord(object?.value ?? null),
  };
};

const writeAuditLogState = (nk: RuntimeNakama, log: TournamentAuditLogRecord, version: string): void => {
  nk.storageWrite([
    {
      collection: TOURNAMENT_AUDIT_COLLECTION,
      key: TOURNAMENT_AUDIT_LOG_KEY,
      value: log,
      version,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    },
  ]);
};

const buildAuditEntryId = (targetId: string, timestamp: string, action: string): string => {
  const compactTimestamp = timestamp.replace(/[^0-9]/g, "");
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${targetId}-${action}-${compactTimestamp}-${randomSuffix}`;
};

const buildAuditEntry = (
  ctx: RuntimeContext,
  target: AuditTarget,
  action: string,
  payloadSummary?: RuntimeMetadata,
): TournamentAuditEntry => {
  const userId = requireAuthenticatedUserId(ctx);
  const timestamp = new Date().toISOString();
  const summary = payloadSummary ?? {};

  return {
    id: buildAuditEntryId(target.id, timestamp, action),
    userId,
    action,
    targetId: target.id,
    timestamp,
    payloadSummary: summary,
    actorUserId: userId,
    actorLabel: getActorLabel(ctx),
    tournamentId: target.id,
    tournamentName: target.name ?? target.id,
    createdAt: timestamp,
    metadata: summary,
  };
};

export const appendTournamentAuditEntry = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  target: AuditTarget,
  action: string,
  payloadSummary?: RuntimeMetadata,
): TournamentAuditEntry => {
  const entry = buildAuditEntry(ctx, target, action, payloadSummary);

  try {
    const currentState = readAuditLogState(nk);
    const nextLog: TournamentAuditLogRecord = {
      entries: [entry].concat(currentState.log.entries).slice(0, MAX_AUDIT_LOG_ENTRIES),
      updatedAt: entry.timestamp,
    };

    writeAuditLogState(nk, nextLog, getStorageObjectVersion(currentState.object) ?? "");
  } catch (error) {
    logger.warn("Unable to append tournament audit entry for %s: %s", target.id, getErrorMessage(error));
  }

  return entry;
};

const parseResponseRecord = (value: string): Record<string, unknown> | null => {
  try {
    return asRecord(JSON.parse(value));
  } catch {
    return null;
  }
};

const resolveDefaultTargetId = (
  ctx: RuntimeContext,
  payload: Record<string, unknown>,
  response: Record<string, unknown> | null,
): string => {
  const responseRun = asRecord(response?.run);
  const responseTournament = asRecord(response?.tournament);

  return (
    readStringField(payload, ["targetId", "target_id", "runId", "run_id", "tournamentId", "tournament_id"]) ??
    readStringField(response, ["targetId", "target_id", "runId", "run_id", "tournamentId", "tournament_id", "userId", "user_id"]) ??
    readStringField(responseRun, ["runId", "run_id", "tournamentId", "tournament_id"]) ??
    readStringField(responseTournament, ["id", "tournamentId", "tournament_id"]) ??
    readStringField(ctx, ["userId", "user_id"]) ??
    "unknown-target"
  );
};

const resolveTargetId = (
  ctx: RuntimeContext,
  payload: Record<string, unknown>,
  response: Record<string, unknown> | null,
  resolver?: AuditedAdminRpcOptions["targetId"],
): string => {
  if (typeof resolver === "function") {
    return resolver(ctx, payload, response) ?? resolveDefaultTargetId(ctx, payload, response);
  }

  if (typeof resolver === "string" && resolver.trim().length > 0) {
    return resolver;
  }

  return resolveDefaultTargetId(ctx, payload, response);
};

const resolveTargetName = (
  ctx: RuntimeContext,
  payload: Record<string, unknown>,
  response: Record<string, unknown> | null,
  targetId: string,
  resolver?: AuditedAdminRpcOptions["targetName"],
): string => {
  if (typeof resolver === "function") {
    return resolver(ctx, payload, response) ?? targetId;
  }

  if (typeof resolver === "string" && resolver.trim().length > 0) {
    return resolver;
  }

  const responseRun = asRecord(response?.run);
  const responseTournament = asRecord(response?.tournament);

  return (
    readStringField(responseRun, ["title", "name"]) ??
    readStringField(responseTournament, ["title", "name"]) ??
    readStringField(payload, ["title", "name"]) ??
    targetId
  );
};

const safeParsePayload = (payload: string): Record<string, unknown> => {
  try {
    return parseJsonPayload(payload);
  } catch {
    return {};
  }
};

const appendAutomatedAdminAuditEntry = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  action: string,
  targetId: string,
  targetName: string,
  payloadSummary: RuntimeMetadata,
): void => {
  try {
    appendTournamentAuditEntry(ctx, logger, nk, { id: targetId, name: targetName }, action, payloadSummary);
  } catch (error) {
    logger.warn("Unable to append automated admin audit entry for %s: %s", targetId, getErrorMessage(error));
  }
};

export const runAuditedAdminRpc = (
  handler: AdminRpcHandler,
  options: AuditedAdminRpcOptions,
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  const parsedPayload = safeParsePayload(payload);

  try {
    const response = handler(ctx, logger, nk, payload);
    const parsedResponse = parseResponseRecord(response);
    const targetId = resolveTargetId(ctx, parsedPayload, parsedResponse, options.targetId);
    const targetName = resolveTargetName(ctx, parsedPayload, parsedResponse, targetId, options.targetName);

    appendAutomatedAdminAuditEntry(
      ctx,
      logger,
      nk,
      options.action,
      targetId,
      targetName,
      createAuditPayloadSummary(parsedPayload),
    );

    return response;
  } catch (error) {
    const targetId = resolveTargetId(ctx, parsedPayload, null, options.targetId);
    const targetName = resolveTargetName(ctx, parsedPayload, null, targetId, options.targetName);

    appendAutomatedAdminAuditEntry(
      ctx,
      logger,
      nk,
      options.failureAction ?? `${options.action}.failed`,
      targetId,
      targetName,
      {
        ...createAuditPayloadSummary(parsedPayload),
        error: getErrorMessage(error),
      },
    );

    throw error;
  }
};

export const listTournamentAuditEntries = (
  nk: RuntimeNakama,
  request: TournamentAuditLogRpcRequest = {},
): TournamentAuditEntry[] => {
  const currentState = readAuditLogState(nk);
  const limit = clampListLimit(request.limit, DEFAULT_AUDIT_LIMIT, MAX_AUDIT_LIMIT);
  const targetId = request.targetId ?? request.tournamentId ?? null;
  const filtered = targetId
    ? currentState.log.entries.filter(
        (entry) => entry.targetId === targetId || entry.tournamentId === targetId,
      )
    : currentState.log.entries.slice();

  return filtered.slice(0, limit);
};

export const rpcListTournamentAuditLog = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  assertAdmin(ctx, "viewer", nk);
  const parsed = parseJsonPayload(payload);
  const request: TournamentAuditLogRpcRequest = {
    targetId: readStringField(parsed, ["targetId", "target_id"]) ?? undefined,
    tournamentId: readStringField(parsed, ["tournamentId", "tournament_id"]) ?? undefined,
    limit: parsed.limit as number | undefined,
  };
  const response: TournamentAuditLogRpcResponse = {
    entries: listTournamentAuditEntries(nk, request),
  };

  return runAuditedAdminRpc(
    () => JSON.stringify(response),
    {
      action: RPC_TOURNAMENT_AUDIT_LOG,
      targetId: request.targetId ?? request.tournamentId ?? "tournament_audit_logs",
      targetName: "Tournament audit logs",
    },
    ctx,
    logger,
    nk,
    payload,
  );
};

export { RPC_TOURNAMENT_AUDIT_LOG };

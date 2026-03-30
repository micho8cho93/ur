import {
  RuntimeStorageObject,
  asRecord,
  findStorageObject,
} from "../progression";
import { runAuditedAdminRpc } from "./audit";
import {
  finalizeTournamentRun,
  getNakamaTournamentById,
  readRunOrThrow,
  resolveOverrideExpiry,
  resolveRunStandingsSnapshot,
} from "./admin";
import { assertAdmin } from "./auth";
import {
  TOURNAMENT_AUDIT_COLLECTION,
  TOURNAMENT_AUDIT_LOG_KEY,
  parseJsonPayload,
  readStringArrayField,
  readStringField,
} from "./definitions";
import { TOURNAMENT_MATCH_RESULTS_COLLECTION } from "./matchResults";
import type {
  RuntimeContext,
  RuntimeLogger,
  RuntimeNakama,
  TournamentStandingsSnapshot,
} from "./types";

export const RPC_ADMIN_EXPORT_TOURNAMENT = "rpc_admin_export_tournament";

const readTournamentAuditEntries = (
  nk: RuntimeNakama,
  runId: string,
): Record<string, unknown>[] => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_AUDIT_COLLECTION,
      key: TOURNAMENT_AUDIT_LOG_KEY,
    },
  ]) as RuntimeStorageObject[];

  const log = asRecord(
    findStorageObject(objects, TOURNAMENT_AUDIT_COLLECTION, TOURNAMENT_AUDIT_LOG_KEY)?.value ?? null,
  );
  const entries = Array.isArray(log?.entries) ? log.entries : [];

  return entries
    .map((entry) => asRecord(entry) ?? null)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .filter((entry) => {
      const targetId = readStringField(entry, ["targetId", "target_id"]);
      const tournamentId = readStringField(entry, ["tournamentId", "tournament_id"]);
      return targetId === runId || tournamentId === runId;
    });
};

const readTournamentMatchResults = (
  nk: RuntimeNakama,
  resultIds: string[],
): Record<string, unknown>[] => {
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
      asRecord(findStorageObject(objects, TOURNAMENT_MATCH_RESULTS_COLLECTION, resultId)?.value ?? null),
    )
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
};

const resolveExportableRun = (
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  runId: string,
) => {
  const existingRun = readRunOrThrow(nk, runId);

  if (existingRun.lifecycle === "finalized") {
    return existingRun;
  }

  if (existingRun.bracket?.finalizedAt) {
    return finalizeTournamentRun(logger, nk, runId, {}).run;
  }

  throw new Error("Tournament export is only available after the run is finalized.");
};

const resolveFinalStandingsSnapshot = (
  nk: RuntimeNakama,
  run: ReturnType<typeof resolveExportableRun>,
  nakamaTournament: Record<string, unknown> | null,
): TournamentStandingsSnapshot => {
  if (run.finalSnapshot) {
    return run.finalSnapshot;
  }

  const participantCount =
    run.bracket?.participants.length ??
    run.registrations.length ??
    Math.max(1, run.maxSize);

  return resolveRunStandingsSnapshot(
    nk,
    run,
    Math.max(1, participantCount),
    resolveOverrideExpiry(null, nakamaTournament),
  );
};

export const rpcAdminExportTournament = (
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

      const run = resolveExportableRun(_logger, _nk, runId);
      const nakamaTournament = getNakamaTournamentById(_nk, run.tournamentId);
      const standings = resolveFinalStandingsSnapshot(_nk, run, nakamaTournament);
      const countedResultIds = readStringArrayField(run.metadata, [
        "countedResultIds",
        "counted_result_ids",
      ]);
      const lastProcessedResultId = readStringField(run.metadata, [
        "lastProcessedResultId",
        "last_processed_result_id",
      ]);
      const resultIds = Array.from(
        new Set(
          countedResultIds.concat(
            lastProcessedResultId && !countedResultIds.includes(lastProcessedResultId)
              ? [lastProcessedResultId]
              : [],
          ),
        ),
      );

      return JSON.stringify({
        ok: true,
        exportedAt: new Date().toISOString(),
        run,
        nakamaTournament,
        standings,
        auditEntries: readTournamentAuditEntries(_nk, run.runId),
        matchResults: readTournamentMatchResults(_nk, resultIds),
      });
    },
    {
      action: RPC_ADMIN_EXPORT_TOURNAMENT,
    },
    ctx,
    logger,
    nk,
    payload,
  );
};

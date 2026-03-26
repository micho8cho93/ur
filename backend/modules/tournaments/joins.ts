import { appendTournamentAuditEntry } from "./audit";
import {
  buildTournamentSummary,
  parseJsonPayload,
  readStringField,
  readTournamentOrThrow,
  requireAuthenticatedUserId,
  updateTournamentWithRetry,
} from "./definitions";
import type {
  RuntimeContext,
  RuntimeLogger,
  RuntimeNakama,
  TournamentJoinRpcRequest,
  TournamentJoinRpcResponse,
  TournamentParticipant,
  TournamentRecord,
} from "./types";

const resolveDisplayName = (ctx: RuntimeContext, requestDisplayName: string | null, userId: string): string => {
  if (requestDisplayName && requestDisplayName.trim().length > 0) {
    return requestDisplayName.trim();
  }

  if (typeof ctx === "object" && ctx !== null) {
    const username = readStringField(ctx, ["username", "displayName", "display_name", "name"]);
    if (username) {
      return username;
    }

    const vars =
      typeof (ctx as Record<string, unknown>).vars === "object" && (ctx as Record<string, unknown>).vars !== null
        ? ((ctx as Record<string, unknown>).vars as Record<string, unknown>)
        : null;
    const fallbackName = readStringField(vars, ["usernameDisplay", "displayName", "email"]);
    if (fallbackName) {
      return fallbackName;
    }
  }

  return `player-${userId.slice(0, 8)}`;
};

const assertTournamentJoinAllowed = (tournament: TournamentRecord): void => {
  if (tournament.status === "complete" || tournament.status === "cancelled") {
    throw new Error(`Tournament '${tournament.name}' is no longer accepting joins.`);
  }
};

export const rpcJoinTournament = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  const userId = requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload(payload);
  const request: TournamentJoinRpcRequest = {
    tournamentId: readStringField(parsed, ["tournamentId", "tournament_id"]) ?? "",
    displayName: readStringField(parsed, ["displayName", "display_name"]) ?? undefined,
  };

  if (!request.tournamentId) {
    throw new Error("tournamentId is required.");
  }

  const current = readTournamentOrThrow(nk, request.tournamentId);
  assertTournamentJoinAllowed(current);

  const displayName = resolveDisplayName(ctx, request.displayName ?? null, userId);
  let joined = false;

  const tournament = updateTournamentWithRetry(nk, logger, request.tournamentId, (existing) => {
    assertTournamentJoinAllowed(existing);

    const existingParticipant = existing.participants.find((participant) => participant.userId === userId);
    if (existingParticipant) {
      return existing;
    }

    if (existing.participants.length >= existing.maxParticipants) {
      throw new Error(`Tournament '${existing.name}' is already full.`);
    }

    const participant: TournamentParticipant = {
      userId,
      displayName,
      joinedAt: new Date().toISOString(),
      status: "joined",
      seed: existing.participants.length + 1,
    };
    joined = true;

    return {
      id: existing.id,
      slug: existing.slug,
      name: existing.name,
      description: existing.description,
      status: existing.status,
      startsAt: existing.startsAt,
      createdAt: existing.createdAt,
      updatedAt: participant.joinedAt,
      createdByUserId: existing.createdByUserId,
      createdByLabel: existing.createdByLabel,
      region: existing.region,
      gameMode: existing.gameMode,
      entryFee: existing.entryFee,
      maxParticipants: existing.maxParticipants,
      rewardCurrency: existing.rewardCurrency,
      rewardPoolAmount: existing.rewardPoolAmount,
      rewardNotes: existing.rewardNotes,
      tags: existing.tags.slice(),
      scoring: {
        winPoints: existing.scoring.winPoints,
        drawPoints: existing.scoring.drawPoints,
        lossPoints: existing.scoring.lossPoints,
        allowDraws: existing.scoring.allowDraws,
      },
      participants: existing.participants.concat(participant),
      results: existing.results.slice(),
    };
  });

  const participant = tournament.participants.find((entry) => entry.userId === userId);
  if (!participant) {
    throw new Error("Unable to resolve joined participant.");
  }

  if (joined) {
    appendTournamentAuditEntry(ctx, logger, nk, tournament, "tournament.joined", {
      joinedUserId: userId,
      displayName: participant.displayName,
    });
  }

  const response: TournamentJoinRpcResponse = {
    tournament: buildTournamentSummary(tournament),
    participant,
    joined,
  };

  return JSON.stringify(response);
};

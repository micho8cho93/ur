import { parseJsonPayload, readStringField, readTournamentOrThrow, requireAuthenticatedUserId } from "./definitions";
import { applyRewardPlanToStandings, buildTournamentRewardPlan } from "./rewards";
import { calculateTournamentStandings } from "./scoring";
import type {
  RuntimeContext,
  RuntimeLogger,
  RuntimeNakama,
  TournamentRecord,
  TournamentStandingsRpcRequest,
  TournamentStandingsRpcResponse,
} from "./types";

export const buildTournamentStandingsSnapshot = (tournament: TournamentRecord) => {
  const standings = calculateTournamentStandings(tournament);
  const rewards = buildTournamentRewardPlan(tournament, standings, tournament.updatedAt);

  return {
    standings: applyRewardPlanToStandings(standings, rewards),
    rewards,
  };
};

export const rpcGetTournamentStandings = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAuthenticatedUserId(ctx);

  const parsed = parseJsonPayload(payload);
  const request: TournamentStandingsRpcRequest = {
    tournamentId: readStringField(parsed, ["tournamentId", "tournament_id"]) ?? "",
  };

  if (!request.tournamentId) {
    throw new Error("tournamentId is required.");
  }

  const tournament = readTournamentOrThrow(nk, request.tournamentId);
  const snapshot = buildTournamentStandingsSnapshot(tournament);
  const response: TournamentStandingsRpcResponse = {
    tournamentId: tournament.id,
    standings: snapshot.standings,
    rewards: snapshot.rewards,
    updatedAt: tournament.updatedAt,
  };

  return JSON.stringify(response);
};

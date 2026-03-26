import {
  RPC_ADMIN_CLOSE_TOURNAMENT,
  RPC_ADMIN_CREATE_TOURNAMENT_RUN,
  RPC_ADMIN_FINALIZE_TOURNAMENT,
  RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG,
  RPC_ADMIN_GET_TOURNAMENT_RUN,
  RPC_ADMIN_GET_TOURNAMENT_STANDINGS,
  RPC_ADMIN_LIST_TOURNAMENTS,
  RPC_ADMIN_OPEN_TOURNAMENT,
  rpcAdminCloseTournament,
  rpcAdminCreateTournamentRun,
  rpcAdminFinalizeTournament,
  rpcAdminGetTournamentAuditLog,
  rpcAdminGetTournamentRun,
  rpcAdminGetTournamentStandings,
  rpcAdminListTournaments,
  rpcAdminOpenTournament,
} from "./admin";
import { RPC_ADMIN_WHOAMI, rpcAdminWhoAmI } from "./auth";
import { runAuditedAdminRpc } from "./audit";
import { RPC_TOURNAMENT_JOIN } from "./definitions";
import { rpcJoinTournament } from "./joins";
import type { RuntimeInitializer } from "./types";

function rpcAdminWhoAmIAudited(ctx: any, logger: any, nk: any, payload: string): string {
  return runAuditedAdminRpc(
    rpcAdminWhoAmI,
    {
      action: RPC_ADMIN_WHOAMI,
      targetName: "Current admin user",
    },
    ctx,
    logger,
    nk,
    payload,
  );
}

function rpcAdminListTournamentsAudited(ctx: any, logger: any, nk: any, payload: string): string {
  return runAuditedAdminRpc(
    rpcAdminListTournaments,
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
}

function rpcAdminGetTournamentRunAudited(ctx: any, logger: any, nk: any, payload: string): string {
  return runAuditedAdminRpc(
    rpcAdminGetTournamentRun,
    {
      action: RPC_ADMIN_GET_TOURNAMENT_RUN,
    },
    ctx,
    logger,
    nk,
    payload,
  );
}

function rpcAdminCreateTournamentRunAudited(ctx: any, logger: any, nk: any, payload: string): string {
  return runAuditedAdminRpc(
    rpcAdminCreateTournamentRun,
    {
      action: RPC_ADMIN_CREATE_TOURNAMENT_RUN,
    },
    ctx,
    logger,
    nk,
    payload,
  );
}

function rpcAdminOpenTournamentAudited(ctx: any, logger: any, nk: any, payload: string): string {
  return runAuditedAdminRpc(
    rpcAdminOpenTournament,
    {
      action: RPC_ADMIN_OPEN_TOURNAMENT,
    },
    ctx,
    logger,
    nk,
    payload,
  );
}

function rpcAdminCloseTournamentAudited(ctx: any, logger: any, nk: any, payload: string): string {
  return runAuditedAdminRpc(
    rpcAdminCloseTournament,
    {
      action: RPC_ADMIN_CLOSE_TOURNAMENT,
    },
    ctx,
    logger,
    nk,
    payload,
  );
}

function rpcAdminFinalizeTournamentAudited(ctx: any, logger: any, nk: any, payload: string): string {
  return runAuditedAdminRpc(
    rpcAdminFinalizeTournament,
    {
      action: RPC_ADMIN_FINALIZE_TOURNAMENT,
    },
    ctx,
    logger,
    nk,
    payload,
  );
}

function rpcAdminGetTournamentStandingsAudited(ctx: any, logger: any, nk: any, payload: string): string {
  return runAuditedAdminRpc(
    rpcAdminGetTournamentStandings,
    {
      action: RPC_ADMIN_GET_TOURNAMENT_STANDINGS,
    },
    ctx,
    logger,
    nk,
    payload,
  );
}

function rpcAdminGetTournamentAuditLogAudited(ctx: any, logger: any, nk: any, payload: string): string {
  return runAuditedAdminRpc(
    rpcAdminGetTournamentAuditLog,
    {
      action: RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG,
      targetName: "Tournament audit log",
    },
    ctx,
    logger,
    nk,
    payload,
  );
}

export const registerTournamentRpcs = (initializer: RuntimeInitializer): void => {
  initializer.registerRpc(RPC_ADMIN_WHOAMI, rpcAdminWhoAmIAudited);
  initializer.registerRpc(RPC_ADMIN_LIST_TOURNAMENTS, rpcAdminListTournamentsAudited);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_RUN, rpcAdminGetTournamentRunAudited);
  initializer.registerRpc(RPC_ADMIN_CREATE_TOURNAMENT_RUN, rpcAdminCreateTournamentRunAudited);
  initializer.registerRpc(RPC_ADMIN_OPEN_TOURNAMENT, rpcAdminOpenTournamentAudited);
  initializer.registerRpc(RPC_ADMIN_CLOSE_TOURNAMENT, rpcAdminCloseTournamentAudited);
  initializer.registerRpc(RPC_ADMIN_FINALIZE_TOURNAMENT, rpcAdminFinalizeTournamentAudited);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_STANDINGS, rpcAdminGetTournamentStandingsAudited);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG, rpcAdminGetTournamentAuditLogAudited);
  initializer.registerRpc(RPC_TOURNAMENT_JOIN, rpcJoinTournament);
};

export * from "./admin";
export * from "./audit";
export * from "./auth";
export * from "./definitions";
export * from "./joins";
export * from "./matchResults";
export * from "./rewards";
export * from "./scoring";
export * from "./standings";
export * from "./types";

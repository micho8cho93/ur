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
import { createAuditedAdminRpc } from "./audit";
import { RPC_TOURNAMENT_JOIN } from "./definitions";
import { rpcJoinTournament } from "./joins";
import type { RuntimeInitializer } from "./types";

export const registerTournamentRpcs = (initializer: RuntimeInitializer): void => {
  initializer.registerRpc(
    RPC_ADMIN_WHOAMI,
    createAuditedAdminRpc(rpcAdminWhoAmI, {
      action: RPC_ADMIN_WHOAMI,
      targetName: "Current admin user",
    }),
  );
  initializer.registerRpc(
    RPC_ADMIN_LIST_TOURNAMENTS,
    createAuditedAdminRpc(rpcAdminListTournaments, {
      action: RPC_ADMIN_LIST_TOURNAMENTS,
      targetId: "tournament_runs",
      targetName: "Tournament runs",
    }),
  );
  initializer.registerRpc(
    RPC_ADMIN_GET_TOURNAMENT_RUN,
    createAuditedAdminRpc(rpcAdminGetTournamentRun, {
      action: RPC_ADMIN_GET_TOURNAMENT_RUN,
    }),
  );
  initializer.registerRpc(
    RPC_ADMIN_CREATE_TOURNAMENT_RUN,
    createAuditedAdminRpc(rpcAdminCreateTournamentRun, {
      action: RPC_ADMIN_CREATE_TOURNAMENT_RUN,
    }),
  );
  initializer.registerRpc(
    RPC_ADMIN_OPEN_TOURNAMENT,
    createAuditedAdminRpc(rpcAdminOpenTournament, {
      action: RPC_ADMIN_OPEN_TOURNAMENT,
    }),
  );
  initializer.registerRpc(
    RPC_ADMIN_CLOSE_TOURNAMENT,
    createAuditedAdminRpc(rpcAdminCloseTournament, {
      action: RPC_ADMIN_CLOSE_TOURNAMENT,
    }),
  );
  initializer.registerRpc(
    RPC_ADMIN_FINALIZE_TOURNAMENT,
    createAuditedAdminRpc(rpcAdminFinalizeTournament, {
      action: RPC_ADMIN_FINALIZE_TOURNAMENT,
    }),
  );
  initializer.registerRpc(
    RPC_ADMIN_GET_TOURNAMENT_STANDINGS,
    createAuditedAdminRpc(rpcAdminGetTournamentStandings, {
      action: RPC_ADMIN_GET_TOURNAMENT_STANDINGS,
    }),
  );
  initializer.registerRpc(
    RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG,
    createAuditedAdminRpc(rpcAdminGetTournamentAuditLog, {
      action: RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG,
      targetName: "Tournament audit log",
    }),
  );
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

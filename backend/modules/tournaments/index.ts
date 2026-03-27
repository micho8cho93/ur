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
import { RPC_TOURNAMENT_JOIN } from "./definitions";
import { rpcJoinTournament } from "./joins";
import {
  RPC_GET_PUBLIC_TOURNAMENT,
  RPC_GET_PUBLIC_TOURNAMENT_STANDINGS,
  RPC_JOIN_PUBLIC_TOURNAMENT,
  RPC_LAUNCH_TOURNAMENT_MATCH,
  RPC_LIST_PUBLIC_TOURNAMENTS,
  rpcGetPublicTournament,
  rpcGetPublicTournamentStandings,
  rpcJoinPublicTournament,
  rpcLaunchTournamentMatch,
  rpcListPublicTournaments,
} from "./public";
import type { RuntimeInitializer } from "./types";

export const registerTournamentRpcs = (initializer: RuntimeInitializer): void => {
  initializer.registerRpc(RPC_ADMIN_WHOAMI, rpcAdminWhoAmI);
  initializer.registerRpc(RPC_ADMIN_LIST_TOURNAMENTS, rpcAdminListTournaments);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_RUN, rpcAdminGetTournamentRun);
  initializer.registerRpc(RPC_ADMIN_CREATE_TOURNAMENT_RUN, rpcAdminCreateTournamentRun);
  initializer.registerRpc(RPC_ADMIN_OPEN_TOURNAMENT, rpcAdminOpenTournament);
  initializer.registerRpc(RPC_ADMIN_CLOSE_TOURNAMENT, rpcAdminCloseTournament);
  initializer.registerRpc(RPC_ADMIN_FINALIZE_TOURNAMENT, rpcAdminFinalizeTournament);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_STANDINGS, rpcAdminGetTournamentStandings);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG, rpcAdminGetTournamentAuditLog);
  initializer.registerRpc(RPC_TOURNAMENT_JOIN, rpcJoinTournament);
  initializer.registerRpc(RPC_LIST_PUBLIC_TOURNAMENTS, rpcListPublicTournaments);
  initializer.registerRpc(RPC_GET_PUBLIC_TOURNAMENT, rpcGetPublicTournament);
  initializer.registerRpc(RPC_GET_PUBLIC_TOURNAMENT_STANDINGS, rpcGetPublicTournamentStandings);
  initializer.registerRpc(RPC_JOIN_PUBLIC_TOURNAMENT, rpcJoinPublicTournament);
  initializer.registerRpc(RPC_LAUNCH_TOURNAMENT_MATCH, rpcLaunchTournamentMatch);
};

export * from "./admin";
export * from "./audit";
export * from "./auth";
export * from "./definitions";
export * from "./joins";
export * from "./matchResults";
export * from "./public";
export * from "./rewards";
export * from "./scoring";
export * from "./standings";
export * from "./types";

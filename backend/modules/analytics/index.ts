import { assertAdmin } from "../tournaments/auth";
import type { RuntimeContext, RuntimeInitializer, RuntimeLogger, RuntimeNakama } from "../tournaments/types";
import {
  getAnalyticsGameplay,
  getAnalyticsOverview,
  getAnalyticsPlayers,
  getAnalyticsProgression,
  getAnalyticsRealtime,
  getAnalyticsSummary,
  getAnalyticsTournaments,
} from "./service";

export const RPC_ADMIN_GET_ANALYTICS_SUMMARY = "rpc_admin_get_analytics_summary";
export const RPC_ADMIN_GET_ANALYTICS_OVERVIEW = "rpc_admin_get_analytics_overview";
export const RPC_ADMIN_GET_ANALYTICS_PLAYERS = "rpc_admin_get_analytics_players";
export const RPC_ADMIN_GET_ANALYTICS_GAMEPLAY = "rpc_admin_get_analytics_gameplay";
export const RPC_ADMIN_GET_ANALYTICS_TOURNAMENTS = "rpc_admin_get_analytics_tournaments";
export const RPC_ADMIN_GET_ANALYTICS_PROGRESSION = "rpc_admin_get_analytics_progression";
export const RPC_ADMIN_GET_ANALYTICS_REALTIME = "rpc_admin_get_analytics_realtime";

const runAnalyticsRpc = (
  ctx: RuntimeContext,
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  payload: string,
  handler: (nk: RuntimeNakama, logger: RuntimeLogger, payload: string) => unknown,
): string => {
  assertAdmin(ctx, "viewer", nk);
  return JSON.stringify(handler(nk, logger, payload));
};

export function rpcAdminGetAnalyticsSummary(
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsSummary);
}

export function rpcAdminGetAnalyticsOverview(
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsOverview);
}

export function rpcAdminGetAnalyticsPlayers(
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsPlayers);
}

export function rpcAdminGetAnalyticsGameplay(
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsGameplay);
}

export function rpcAdminGetAnalyticsTournaments(
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsTournaments);
}

export function rpcAdminGetAnalyticsProgression(
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsProgression);
}

export function rpcAdminGetAnalyticsRealtime(
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsRealtime);
}

export const registerAnalyticsRpcs = (initializer: RuntimeInitializer): void => {
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_SUMMARY, rpcAdminGetAnalyticsSummary);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_OVERVIEW, rpcAdminGetAnalyticsOverview);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_PLAYERS, rpcAdminGetAnalyticsPlayers);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_GAMEPLAY, rpcAdminGetAnalyticsGameplay);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_TOURNAMENTS, rpcAdminGetAnalyticsTournaments);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_PROGRESSION, rpcAdminGetAnalyticsProgression);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_REALTIME, rpcAdminGetAnalyticsRealtime);
};

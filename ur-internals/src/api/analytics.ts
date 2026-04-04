import env from '../config/env'
import type {
  AnalyticsDashboardBundle,
  AnalyticsGameplayData,
  AnalyticsOverviewData,
  AnalyticsPlayersData,
  AnalyticsProgressionData,
  AnalyticsQueryFilters,
  AnalyticsRealtimeData,
  AnalyticsResponse,
  AnalyticsSummaryData,
  AnalyticsTournamentFilterOption,
  AnalyticsTournamentsData,
} from '../types/analytics'
import { callRpc } from './client'
import { listTournaments } from './tournaments'

const RPC_ADMIN_GET_ANALYTICS_SUMMARY = 'rpc_admin_get_analytics_summary'
const RPC_ADMIN_GET_ANALYTICS_OVERVIEW = 'rpc_admin_get_analytics_overview'
const RPC_ADMIN_GET_ANALYTICS_PLAYERS = 'rpc_admin_get_analytics_players'
const RPC_ADMIN_GET_ANALYTICS_GAMEPLAY = 'rpc_admin_get_analytics_gameplay'
const RPC_ADMIN_GET_ANALYTICS_TOURNAMENTS = 'rpc_admin_get_analytics_tournaments'
const RPC_ADMIN_GET_ANALYTICS_PROGRESSION = 'rpc_admin_get_analytics_progression'
const RPC_ADMIN_GET_ANALYTICS_REALTIME = 'rpc_admin_get_analytics_realtime'

function buildPayload(filters: AnalyticsQueryFilters) {
  return {
    startDate: filters.startDate,
    endDate: filters.endDate,
    tournamentId: filters.tournamentId ?? undefined,
    gameMode: filters.gameMode ?? undefined,
    eloMin: filters.eloMin ?? undefined,
    eloMax: filters.eloMax ?? undefined,
    limit: filters.limit,
  }
}

async function fetchAnalytics<TData>(endpoint: string, filters: AnalyticsQueryFilters) {
  return callRpc<AnalyticsResponse<TData>>(endpoint, buildPayload(filters))
}

export function getAnalyticsSummary(filters: AnalyticsQueryFilters) {
  return fetchAnalytics<AnalyticsSummaryData>(RPC_ADMIN_GET_ANALYTICS_SUMMARY, filters)
}

export function getAnalyticsOverview(filters: AnalyticsQueryFilters) {
  return fetchAnalytics<AnalyticsOverviewData>(RPC_ADMIN_GET_ANALYTICS_OVERVIEW, filters)
}

export function getAnalyticsPlayers(filters: AnalyticsQueryFilters) {
  return fetchAnalytics<AnalyticsPlayersData>(RPC_ADMIN_GET_ANALYTICS_PLAYERS, filters)
}

export function getAnalyticsGameplay(filters: AnalyticsQueryFilters) {
  return fetchAnalytics<AnalyticsGameplayData>(RPC_ADMIN_GET_ANALYTICS_GAMEPLAY, filters)
}

export function getAnalyticsTournaments(filters: AnalyticsQueryFilters) {
  return fetchAnalytics<AnalyticsTournamentsData>(RPC_ADMIN_GET_ANALYTICS_TOURNAMENTS, filters)
}

export function getAnalyticsProgression(filters: AnalyticsQueryFilters) {
  return fetchAnalytics<AnalyticsProgressionData>(RPC_ADMIN_GET_ANALYTICS_PROGRESSION, filters)
}

export function getAnalyticsRealtime(filters: AnalyticsQueryFilters) {
  return fetchAnalytics<AnalyticsRealtimeData>(RPC_ADMIN_GET_ANALYTICS_REALTIME, filters)
}

export async function getAnalyticsDashboardBundle(
  filters: AnalyticsQueryFilters,
): Promise<AnalyticsDashboardBundle> {
  const [summary, overview, players, gameplay, tournaments, progression] = await Promise.all([
    getAnalyticsSummary(filters),
    getAnalyticsOverview(filters),
    getAnalyticsPlayers(filters),
    getAnalyticsGameplay(filters),
    getAnalyticsTournaments(filters),
    getAnalyticsProgression(filters),
  ])

  return {
    summary,
    overview,
    players,
    gameplay,
    tournaments,
    progression,
  }
}

export async function listAnalyticsTournamentFilterOptions(): Promise<AnalyticsTournamentFilterOption[]> {
  if (env.useMockData) {
    return []
  }

  const tournaments = await listTournaments(100)

  return tournaments
    .map((tournament) => ({
      id: tournament.id,
      label: tournament.name,
      gameMode: tournament.gameMode,
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

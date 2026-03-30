import env from '../config/env'
import { buildTournamentLiveDetailData, buildTournamentLiveOverviewData } from '../liveOps'
import type {
  TournamentActiveMatchesByRound,
  TournamentLiveAlert,
  TournamentLiveDetailData,
  TournamentLiveEntry,
  TournamentLiveOverviewData,
  TournamentLiveSummary,
  TournamentMatchDurationBucket,
  TournamentParticipantStateCounts,
  TournamentRoundStats,
  TournamentSeedSurvivalPoint,
  TournamentStatus,
  TournamentTimelineBucket,
} from '../types/tournament'
import { getTournamentAuditLog, listAuditLog } from './auditLog'
import { ApiError, callRpc } from './client'
import { getTournament, listTournaments } from './tournaments'
import { asRecord, readArrayField, readBooleanField, readNumberField, readStringField } from './runtime'

const RPC_ADMIN_GET_TOURNAMENT_LIVE_STATUS = 'rpc_admin_get_tournament_live_status'

function mapLifecycle(value: string | null): TournamentStatus {
  if (value === 'open' || value === 'Open') {
    return 'Open'
  }

  if (value === 'closed' || value === 'Closed') {
    return 'Closed'
  }

  if (value === 'finalized' || value === 'Finalized') {
    return 'Finalized'
  }

  return 'Draft'
}

function normalizeLiveAlert(value: unknown): TournamentLiveAlert | null {
  const record = asRecord(value)
  const code = readStringField(record, ['code'])
  const level = readStringField(record, ['level'])
  const message = readStringField(record, ['message'])
  const count = readNumberField(record, ['count'])

  if (
    !record ||
    !code ||
    !message ||
    (level !== 'info' && level !== 'warning' && level !== 'critical' && level !== 'success')
  ) {
    return null
  }

  return {
    code: code as TournamentLiveAlert['code'],
    level: level as TournamentLiveAlert['level'],
    message,
    count: typeof count === 'number' ? count : 0,
  }
}

function normalizeLiveSummary(value: unknown): TournamentLiveSummary | null {
  const record = asRecord(value)
  const runId = readStringField(record, ['runId', 'run_id'])
  const tournamentId = readStringField(record, ['tournamentId', 'tournament_id'])
  const title = readStringField(record, ['title'])
  const updatedAt = readStringField(record, ['updatedAt', 'updated_at'])

  if (!record || !runId || !tournamentId || !title || !updatedAt) {
    return null
  }

  return {
    runId,
    tournamentId,
    title,
    lifecycle: mapLifecycle(readStringField(record, ['lifecycle'])),
    startAt: readStringField(record, ['startAt', 'start_at']),
    openedAt: readStringField(record, ['openedAt', 'opened_at']),
    closedAt: readStringField(record, ['closedAt', 'closed_at']),
    finalizedAt: readStringField(record, ['finalizedAt', 'finalized_at']),
    updatedAt,
    entrants: Math.max(0, Math.floor(readNumberField(record, ['entrants']) ?? 0)),
    capacity: Math.max(0, Math.floor(readNumberField(record, ['capacity']) ?? 0)),
    registrationFillPercent: Math.max(
      0,
      Math.floor(readNumberField(record, ['registrationFillPercent', 'registration_fill_percent']) ?? 0),
    ),
    currentRound: readNumberField(record, ['currentRound', 'current_round']) ?? null,
    totalRounds: readNumberField(record, ['totalRounds', 'total_rounds']) ?? null,
    totalMatches: Math.max(0, Math.floor(readNumberField(record, ['totalMatches', 'total_matches']) ?? 0)),
    completedMatches: Math.max(
      0,
      Math.floor(readNumberField(record, ['completedMatches', 'completed_matches']) ?? 0),
    ),
    pendingMatches: Math.max(
      0,
      Math.floor(readNumberField(record, ['pendingMatches', 'pending_matches']) ?? 0),
    ),
    readyMatches: Math.max(0, Math.floor(readNumberField(record, ['readyMatches', 'ready_matches']) ?? 0)),
    activeMatches: Math.max(0, Math.floor(readNumberField(record, ['activeMatches', 'active_matches']) ?? 0)),
    waitingPlayers: Math.max(
      0,
      Math.floor(readNumberField(record, ['waitingPlayers', 'waiting_players']) ?? 0),
    ),
    playersInMatch: Math.max(
      0,
      Math.floor(readNumberField(record, ['playersInMatch', 'players_in_match']) ?? 0),
    ),
    lastActivityAt: readStringField(record, ['lastActivityAt', 'last_activity_at']),
    lastResultAt: readStringField(record, ['lastResultAt', 'last_result_at']),
    startingSoon: readBooleanField(record, ['startingSoon', 'starting_soon']) === true,
    finalizeReady: readBooleanField(record, ['finalizeReady', 'finalize_ready']) === true,
    actionNeeded: readBooleanField(record, ['actionNeeded', 'action_needed']) === true,
    urgencyScore: Math.max(0, Math.floor(readNumberField(record, ['urgencyScore', 'urgency_score']) ?? 0)),
    alerts: readArrayField(record, ['alerts'])
      .map((entry) => normalizeLiveAlert(entry))
      .filter((entry): entry is TournamentLiveAlert => Boolean(entry)),
  }
}

function normalizeRoundStats(value: unknown): TournamentRoundStats | null {
  const record = asRecord(value)
  const round = readNumberField(record, ['round'])
  const label = readStringField(record, ['label'])

  if (!record || typeof round !== 'number' || !label) {
    return null
  }

  return {
    round,
    label,
    totalMatches: Math.max(0, Math.floor(readNumberField(record, ['totalMatches', 'total_matches']) ?? 0)),
    pending: Math.max(0, Math.floor(readNumberField(record, ['pending']) ?? 0)),
    ready: Math.max(0, Math.floor(readNumberField(record, ['ready']) ?? 0)),
    inMatch: Math.max(0, Math.floor(readNumberField(record, ['inMatch', 'in_match']) ?? 0)),
    completed: Math.max(0, Math.floor(readNumberField(record, ['completed']) ?? 0)),
    completionPercent: Math.max(
      0,
      Math.floor(readNumberField(record, ['completionPercent', 'completion_percent']) ?? 0),
    ),
  }
}

function normalizeParticipantStateCounts(value: unknown): TournamentParticipantStateCounts {
  const record = asRecord(value)

  return {
    lobby: Math.max(0, Math.floor(readNumberField(record, ['lobby']) ?? 0)),
    inMatch: Math.max(0, Math.floor(readNumberField(record, ['inMatch', 'in_match']) ?? 0)),
    waitingNextRound: Math.max(
      0,
      Math.floor(readNumberField(record, ['waitingNextRound', 'waiting_next_round']) ?? 0),
    ),
    eliminated: Math.max(0, Math.floor(readNumberField(record, ['eliminated']) ?? 0)),
    runnerUp: Math.max(0, Math.floor(readNumberField(record, ['runnerUp', 'runner_up']) ?? 0)),
    champion: Math.max(0, Math.floor(readNumberField(record, ['champion']) ?? 0)),
  }
}

function normalizeLiveEntry(value: unknown): TournamentLiveEntry | null {
  const record = asRecord(value)
  const entryId = readStringField(record, ['entryId', 'entry_id'])
  const round = readNumberField(record, ['round'])
  const slot = readNumberField(record, ['slot'])
  const status = readStringField(record, ['status'])

  if (
    !record ||
    !entryId ||
    typeof round !== 'number' ||
    typeof slot !== 'number' ||
    (status !== 'pending' && status !== 'ready' && status !== 'in_match' && status !== 'completed')
  ) {
    return null
  }

  return {
    entryId,
    round,
    slot,
    status: status as TournamentLiveEntry['status'],
    playerAUserId: readStringField(record, ['playerAUserId', 'player_a_user_id']),
    playerADisplayName: readStringField(record, ['playerADisplayName', 'player_a_display_name']),
    playerBUserId: readStringField(record, ['playerBUserId', 'player_b_user_id']),
    playerBDisplayName: readStringField(record, ['playerBDisplayName', 'player_b_display_name']),
    winnerUserId: readStringField(record, ['winnerUserId', 'winner_user_id']),
    loserUserId: readStringField(record, ['loserUserId', 'loser_user_id']),
    matchId: readStringField(record, ['matchId', 'match_id']),
    readyAt: readStringField(record, ['readyAt', 'ready_at']),
    startedAt: readStringField(record, ['startedAt', 'started_at']),
    completedAt: readStringField(record, ['completedAt', 'completed_at']),
    durationSeconds: readNumberField(record, ['durationSeconds', 'duration_seconds']) ?? null,
    stale: readBooleanField(record, ['stale']) === true,
    staleReason: readStringField(record, ['staleReason', 'stale_reason']),
    blockedReason: readStringField(record, ['blockedReason', 'blocked_reason']),
  }
}

function normalizeTimelineBucket(value: unknown): TournamentTimelineBucket | null {
  const record = asRecord(value)
  const bucketStart = readStringField(record, ['bucketStart', 'bucket_start'])
  const bucketEnd = readStringField(record, ['bucketEnd', 'bucket_end'])

  if (!record || !bucketStart || !bucketEnd) {
    return null
  }

  return {
    bucketStart,
    bucketEnd,
    count: Math.max(0, Math.floor(readNumberField(record, ['count']) ?? 0)),
  }
}

function normalizeActiveMatchesByRound(value: unknown): TournamentActiveMatchesByRound | null {
  const record = asRecord(value)
  const round = readNumberField(record, ['round'])

  if (!record || typeof round !== 'number') {
    return null
  }

  return {
    round,
    count: Math.max(0, Math.floor(readNumberField(record, ['count']) ?? 0)),
  }
}

function normalizeMatchDurationBucket(value: unknown): TournamentMatchDurationBucket | null {
  const record = asRecord(value)
  const label = readStringField(record, ['label'])

  if (!record || !label) {
    return null
  }

  return {
    label,
    minSeconds: readNumberField(record, ['minSeconds', 'min_seconds']) ?? null,
    maxSeconds: readNumberField(record, ['maxSeconds', 'max_seconds']) ?? null,
    count: Math.max(0, Math.floor(readNumberField(record, ['count']) ?? 0)),
  }
}

function normalizeSeedSurvivalPoint(value: unknown): TournamentSeedSurvivalPoint | null {
  const record = asRecord(value)
  const round = readNumberField(record, ['round'])
  const label = readStringField(record, ['label'])

  if (!record || typeof round !== 'number' || !label) {
    return null
  }

  return {
    round,
    label,
    survivingCount: Math.max(0, Math.floor(readNumberField(record, ['survivingCount', 'surviving_count']) ?? 0)),
    topSeedRemaining: readNumberField(record, ['topSeedRemaining', 'top_seed_remaining']) ?? null,
    averageSeedRemaining:
      readNumberField(record, ['averageSeedRemaining', 'average_seed_remaining']) ?? null,
  }
}

function isMissingRpcError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('function not found') ||
    message.includes('rpc function not found') ||
    (error instanceof ApiError && error.status === 404)
  )
}

function normalizeOverviewResponse(value: unknown): TournamentLiveOverviewData | null {
  const record = asRecord(value)
  const generatedAt = readStringField(record, ['generatedAt', 'generated_at'])

  if (!record || !generatedAt) {
    return null
  }

  return {
    generatedAt,
    summaries: readArrayField(record, ['summaries'])
      .map((entry) => normalizeLiveSummary(entry))
      .filter((entry): entry is TournamentLiveSummary => Boolean(entry)),
    activeMatchesByRound: readArrayField(record, ['activeMatchesByRound', 'active_matches_by_round'])
      .map((entry) => normalizeActiveMatchesByRound(entry))
      .filter((entry): entry is TournamentActiveMatchesByRound => Boolean(entry)),
    completionsOverTime: readArrayField(record, ['completionsOverTime', 'completions_over_time'])
      .map((entry) => normalizeTimelineBucket(entry))
      .filter((entry): entry is TournamentTimelineBucket => Boolean(entry)),
    auditActivityTimeline: readArrayField(record, ['auditActivityTimeline', 'audit_activity_timeline'])
      .map((entry) => normalizeTimelineBucket(entry))
      .filter((entry): entry is TournamentTimelineBucket => Boolean(entry)),
  }
}

function normalizeDetailResponse(value: unknown): TournamentLiveDetailData | null {
  const record = asRecord(value)
  const generatedAt = readStringField(record, ['generatedAt', 'generated_at'])
  const summary = normalizeLiveSummary(record?.summary)

  if (!record || !generatedAt || !summary) {
    return null
  }

  return {
    generatedAt,
    summary,
    roundStats: readArrayField(record, ['roundStats', 'round_stats'])
      .map((entry) => normalizeRoundStats(entry))
      .filter((entry): entry is TournamentRoundStats => Boolean(entry)),
    participantStateCounts: normalizeParticipantStateCounts(
      record.participantStateCounts ?? record.participant_state_counts,
    ),
    liveEntries: readArrayField(record, ['liveEntries', 'live_entries'])
      .map((entry) => normalizeLiveEntry(entry))
      .filter((entry): entry is TournamentLiveEntry => Boolean(entry)),
    matchDurationBuckets: readArrayField(record, ['matchDurationBuckets', 'match_duration_buckets'])
      .map((entry) => normalizeMatchDurationBucket(entry))
      .filter((entry): entry is TournamentMatchDurationBucket => Boolean(entry)),
    seedSurvival: readArrayField(record, ['seedSurvival', 'seed_survival'])
      .map((entry) => normalizeSeedSurvivalPoint(entry))
      .filter((entry): entry is TournamentSeedSurvivalPoint => Boolean(entry)),
    auditActivityTimeline: readArrayField(record, ['auditActivityTimeline', 'audit_activity_timeline'])
      .map((entry) => normalizeTimelineBucket(entry))
      .filter((entry): entry is TournamentTimelineBucket => Boolean(entry)),
  }
}

export async function getTournamentLiveOverview(limit = 12): Promise<TournamentLiveOverviewData> {
  if (!env.useMockData) {
    try {
      const response = await callRpc(RPC_ADMIN_GET_TOURNAMENT_LIVE_STATUS, { limit })
      const normalized = normalizeOverviewResponse(response)
      if (normalized) {
        return normalized
      }
    } catch (error) {
      if (!isMissingRpcError(error)) {
        throw error
      }
    }
  }

  const [tournaments, auditEntries] = await Promise.all([
    listTournaments(limit),
    listAuditLog(60),
  ])
  return buildTournamentLiveOverviewData(tournaments, auditEntries)
}

export async function getTournamentLiveDetail(runId: string): Promise<TournamentLiveDetailData> {
  if (!env.useMockData) {
    try {
      const response = await callRpc(RPC_ADMIN_GET_TOURNAMENT_LIVE_STATUS, { runId })
      const normalized = normalizeDetailResponse(response)
      if (normalized) {
        return normalized
      }
    } catch (error) {
      if (!isMissingRpcError(error)) {
        throw error
      }
    }
  }

  const [tournament, auditEntries] = await Promise.all([
    getTournament(runId),
    getTournamentAuditLog(runId, 50),
  ])

  if (!tournament) {
    throw new Error(`Tournament run '${runId}' was not found.`)
  }

  return buildTournamentLiveDetailData(tournament, auditEntries)
}

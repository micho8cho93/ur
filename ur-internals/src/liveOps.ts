import type { AuditLogEntry } from './types/audit'
import type {
  Tournament,
  TournamentActiveMatchesByRound,
  TournamentExportBundle,
  TournamentLiveDetailData,
  TournamentLiveEntry,
  TournamentLiveOverviewData,
  TournamentLiveSummary,
  TournamentMatchDurationBucket,
  TournamentParticipantStateCounts,
  TournamentRoundStats,
  TournamentSeedSurvivalPoint,
  TournamentStandings,
  TournamentStatus,
  TournamentTimelineBucket,
} from './types/tournament'

const STARTING_SOON_WINDOW_MS = 60 * 60 * 1000
const READY_STALE_WINDOW_MS = 10 * 60 * 1000
const IN_MATCH_STALE_WINDOW_MS = 25 * 60 * 1000
const RECENT_RUN_WINDOW_MS = 72 * 60 * 60 * 1000
const OVERVIEW_TIMELINE_BUCKET_COUNT = 8
const OVERVIEW_TIMELINE_BUCKET_HOURS = 6
const DETAIL_TIMELINE_BUCKET_COUNT = 8
const DETAIL_TIMELINE_BUCKET_HOURS = 3

function parseIsoMs(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function maxIso(...values: Array<string | null | undefined>) {
  const timestamps = values
    .map((value) => parseIsoMs(value))
    .filter((value): value is number => value !== null)

  if (timestamps.length === 0) {
    return null
  }

  return new Date(Math.max(...timestamps)).toISOString()
}

function formatCountLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

function describeElapsedMinutes(durationMs: number) {
  const minutes = Math.max(1, Math.round(durationMs / 60000))
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

function getRoundLabel(round: number, totalRounds: number | null) {
  if (typeof totalRounds === 'number' && round === totalRounds) {
    return 'Final'
  }

  return `Round ${round}`
}

function createEmptyParticipantStateCounts(): TournamentParticipantStateCounts {
  return {
    lobby: 0,
    inMatch: 0,
    waitingNextRound: 0,
    eliminated: 0,
    runnerUp: 0,
    champion: 0,
  }
}

function buildParticipantNameMap(tournament: Tournament) {
  const names = new Map<string, string>()

  tournament.registrations.forEach((registration) => {
    names.set(registration.userId, registration.displayName)
  })

  tournament.bracket?.participants.forEach((participant) => {
    names.set(participant.userId, participant.displayName)
  })

  tournament.finalSnapshot?.records.forEach((record) => {
    const ownerId =
      typeof record.ownerId === 'string'
        ? record.ownerId
        : typeof record.owner_id === 'string'
          ? record.owner_id
          : null
    const username = typeof record.username === 'string' ? record.username : null

    if (ownerId && username) {
      names.set(ownerId, username)
    }
  })

  return names
}

function getEntryDurationSeconds(entry: NonNullable<Tournament['bracket']>['entries'][number]) {
  const startedAtMs = parseIsoMs(entry.startedAt)
  const completedAtMs = parseIsoMs(entry.completedAt)

  if (startedAtMs === null || completedAtMs === null || completedAtMs < startedAtMs) {
    return null
  }

  return Math.floor((completedAtMs - startedAtMs) / 1000)
}

function isReadyEntryStale(entry: NonNullable<Tournament['bracket']>['entries'][number], nowMs: number) {
  if (entry.status !== 'ready') {
    return false
  }

  const readyAtMs = parseIsoMs(entry.readyAt ?? entry.updatedAt)
  return readyAtMs !== null && nowMs - readyAtMs >= READY_STALE_WINDOW_MS
}

function isInMatchEntryStale(entry: NonNullable<Tournament['bracket']>['entries'][number], nowMs: number) {
  if (entry.status !== 'in_match') {
    return false
  }

  const startedAtMs = parseIsoMs(entry.startedAt ?? entry.updatedAt)
  return startedAtMs !== null && nowMs - startedAtMs >= IN_MATCH_STALE_WINDOW_MS
}

function buildParticipantStateCounts(tournament: Tournament): TournamentParticipantStateCounts {
  const counts = createEmptyParticipantStateCounts()
  const participants = tournament.bracket?.participants ?? []

  if (participants.length === 0) {
    counts.lobby = tournament.registrations.length
    return counts
  }

  participants.forEach((participant) => {
    if (participant.state === 'in_match') {
      counts.inMatch += 1
      return
    }

    if (participant.state === 'waiting_next_round') {
      counts.waitingNextRound += 1
      return
    }

    if (participant.state === 'eliminated') {
      counts.eliminated += 1
      return
    }

    if (participant.state === 'runner_up') {
      counts.runnerUp += 1
      return
    }

    if (participant.state === 'champion') {
      counts.champion += 1
      return
    }

    counts.lobby += 1
  })

  return counts
}

function buildRoundStats(tournament: Tournament): TournamentRoundStats[] {
  if (!tournament.bracket || tournament.bracket.entries.length === 0) {
    return []
  }

  const rounds = Array.from(new Set(tournament.bracket.entries.map((entry) => entry.round))).sort(
    (left, right) => left - right,
  )

  return rounds.map((round) => {
    const entries = tournament.bracket?.entries.filter((entry) => entry.round === round) ?? []
    const pending = entries.filter((entry) => entry.status === 'pending').length
    const ready = entries.filter((entry) => entry.status === 'ready').length
    const inMatch = entries.filter((entry) => entry.status === 'in_match').length
    const completed = entries.filter((entry) => entry.status === 'completed').length

    return {
      round,
      label: getRoundLabel(round, tournament.bracket?.totalRounds ?? null),
      totalMatches: entries.length,
      pending,
      ready,
      inMatch,
      completed,
      completionPercent: entries.length > 0 ? Math.round((completed / entries.length) * 100) : 0,
    }
  })
}

function getCurrentRound(tournament: Tournament) {
  if (!tournament.bracket) {
    return null
  }

  const activeEntry = tournament.bracket.entries
    .filter((entry) => entry.status !== 'completed')
    .sort((left, right) => {
      if (left.round !== right.round) {
        return left.round - right.round
      }

      return left.slot - right.slot
    })[0]

  return activeEntry?.round ?? null
}

function buildLiveEntries(
  tournament: Tournament,
  nowMs: number,
): TournamentLiveEntry[] {
  const nameByUserId = buildParticipantNameMap(tournament)
  const entries = tournament.bracket?.entries ?? []

  return entries
    .map((entry) => {
      let staleReason: string | null = null
      if (entry.status === 'ready') {
        const readyAtMs = parseIsoMs(entry.readyAt ?? entry.updatedAt)
        if (readyAtMs !== null && nowMs - readyAtMs >= READY_STALE_WINDOW_MS) {
          staleReason = `Ready for ${describeElapsedMinutes(nowMs - readyAtMs)} without a match launch.`
        }
      }

      if (entry.status === 'in_match') {
        const startedAtMs = parseIsoMs(entry.startedAt ?? entry.updatedAt)
        if (startedAtMs !== null && nowMs - startedAtMs >= IN_MATCH_STALE_WINDOW_MS) {
          staleReason = `In match for ${describeElapsedMinutes(nowMs - startedAtMs)} without a result.`
        }
      }

      let blockedReason: string | null = null
      if (entry.status === 'pending') {
        if (entry.playerAUserId && !entry.playerBUserId) {
          blockedReason = `${nameByUserId.get(entry.playerAUserId) ?? entry.playerAUserId} is waiting for an opponent.`
        } else if (!entry.playerAUserId && entry.playerBUserId) {
          blockedReason = `${nameByUserId.get(entry.playerBUserId) ?? entry.playerBUserId} is waiting for an opponent.`
        } else if (entry.sourceEntryIds.length > 0) {
          blockedReason = `Waiting for winners from ${entry.sourceEntryIds.join(', ')}.`
        } else {
          blockedReason = 'Waiting for the bracket to resolve upstream results.'
        }
      }

      return {
        entryId: entry.entryId,
        round: entry.round,
        slot: entry.slot,
        status: entry.status,
        playerAUserId: entry.playerAUserId,
        playerADisplayName: entry.playerAUserId
          ? (nameByUserId.get(entry.playerAUserId) ?? entry.playerAUserId)
          : null,
        playerBUserId: entry.playerBUserId,
        playerBDisplayName: entry.playerBUserId
          ? (nameByUserId.get(entry.playerBUserId) ?? entry.playerBUserId)
          : null,
        winnerUserId: entry.winnerUserId,
        loserUserId: entry.loserUserId,
        matchId: entry.matchId,
        readyAt: entry.readyAt,
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
        durationSeconds: getEntryDurationSeconds(entry),
        stale: staleReason !== null,
        staleReason,
        blockedReason,
      }
    })
    .sort((left, right) => {
      const statusPriority: Record<TournamentLiveEntry['status'], number> = {
        in_match: 0,
        ready: 1,
        pending: 2,
        completed: 3,
      }

      if (statusPriority[left.status] !== statusPriority[right.status]) {
        return statusPriority[left.status] - statusPriority[right.status]
      }

      if (left.round !== right.round) {
        return left.round - right.round
      }

      return left.slot - right.slot
    })
}

export function buildTournamentLiveSummary(
  tournament: Tournament,
  auditEntries: AuditLogEntry[],
  generatedAt = new Date().toISOString(),
): TournamentLiveSummary {
  const nowMs = parseIsoMs(generatedAt) ?? Date.now()
  const participantCounts = buildParticipantStateCounts(tournament)
  const roundStats = buildRoundStats(tournament)
  const entries = tournament.bracket?.entries ?? []
  const totalMatches = entries.length
  const completedMatches = roundStats.reduce((total, round) => total + round.completed, 0)
  const pendingMatches = roundStats.reduce((total, round) => total + round.pending, 0)
  const readyMatches = roundStats.reduce((total, round) => total + round.ready, 0)
  const activeMatches = roundStats.reduce((total, round) => total + round.inMatch, 0)
  const staleEntryCount = entries.filter(
    (entry) => isReadyEntryStale(entry, nowMs) || isInMatchEntryStale(entry, nowMs),
  ).length
  const lastResultAt = entries.reduce<string | null>((latest, entry) => maxIso(latest, entry.completedAt), null)
  const lastActivityAt = maxIso(
    tournament.updatedAt,
    lastResultAt,
    ...entries.flatMap((entry) => [entry.updatedAt, entry.readyAt, entry.startedAt, entry.completedAt]),
    ...auditEntries.map((entry) => entry.createdAt),
  )
  const finalizedFromBracket =
    Boolean(tournament.bracket?.finalizedAt) || (totalMatches > 0 && completedMatches === totalMatches)
  const finalizeReady = tournament.status !== 'Finalized' && finalizedFromBracket
  const startAtMs = parseIsoMs(tournament.startAt)
  const startingSoon =
    startAtMs !== null &&
    startAtMs > nowMs &&
    startAtMs - nowMs <= STARTING_SOON_WINDOW_MS &&
    tournament.status !== 'Finalized'

  const alerts: TournamentLiveSummary['alerts'] = []
  if (staleEntryCount > 0) {
    alerts.push({
      code: 'stale_match',
      level: 'critical',
      message: `${formatCountLabel(staleEntryCount, 'stale match')} needs operator attention.`,
      count: staleEntryCount,
    })
  }

  if (readyMatches > 0) {
    alerts.push({
      code: 'ready_matches',
      level: 'warning',
      message: `${formatCountLabel(readyMatches, 'match')} ready to launch.`,
      count: readyMatches,
    })
  }

  if (activeMatches > 0) {
    alerts.push({
      code: 'active_matches',
      level: 'info',
      message: `${formatCountLabel(activeMatches, 'active match')} in progress.`,
      count: activeMatches,
    })
  }

  if (participantCounts.waitingNextRound > 0) {
    alerts.push({
      code: 'waiting_players',
      level: readyMatches > 0 || activeMatches > 0 ? 'info' : 'warning',
      message: `${formatCountLabel(participantCounts.waitingNextRound, 'player')} waiting for the next round.`,
      count: participantCounts.waitingNextRound,
    })
  }

  if (startingSoon) {
    alerts.push({
      code: 'starting_soon',
      level: 'info',
      message: 'Run starts within the next hour.',
      count: 1,
    })
  }

  if (finalizeReady) {
    alerts.push({
      code: 'finalize_ready',
      level: 'success',
      message: 'Bracket is complete and ready to finalize.',
      count: 1,
    })
  }

  if (tournament.status === 'Finalized') {
    alerts.push({
      code: 'finalized',
      level: 'success',
      message: 'Run is finalized and export-ready.',
      count: 1,
    })
  }

  const entrants = Math.max(tournament.entrants, tournament.registrations.length)
  const capacity = Math.max(tournament.maxEntrants, entrants)
  const actionNeeded = alerts.some((alert) => alert.level === 'warning' || alert.level === 'critical')

  return {
    runId: tournament.id,
    tournamentId: tournament.tournamentId,
    title: tournament.name,
    lifecycle: tournament.status,
    startAt: tournament.startAt,
    openedAt: tournament.openedAt,
    closedAt: tournament.closedAt,
    finalizedAt: tournament.finalizedAt ?? tournament.bracket?.finalizedAt ?? null,
    updatedAt: tournament.updatedAt,
    entrants,
    capacity,
    registrationFillPercent: capacity > 0 ? Math.round((entrants / capacity) * 100) : 0,
    currentRound: getCurrentRound(tournament),
    totalRounds: tournament.bracket?.totalRounds ?? tournament.roundCount,
    totalMatches,
    completedMatches,
    pendingMatches,
    readyMatches,
    activeMatches,
    waitingPlayers: participantCounts.waitingNextRound,
    playersInMatch: participantCounts.inMatch,
    lastActivityAt,
    lastResultAt,
    startingSoon,
    finalizeReady,
    actionNeeded,
    urgencyScore:
      staleEntryCount * 100 +
      readyMatches * 35 +
      activeMatches * 20 +
      participantCounts.waitingNextRound * 8 +
      (startingSoon ? 15 : 0) +
      (tournament.status === 'Open' ? 10 : 0) +
      (finalizeReady ? 5 : 0),
    alerts,
  }
}

export function sortTournamentLiveSummariesByUrgency(summaries: TournamentLiveSummary[]) {
  return summaries.slice().sort((left, right) => {
    if (left.urgencyScore !== right.urgencyScore) {
      return right.urgencyScore - left.urgencyScore
    }

    const leftActivity = parseIsoMs(left.lastActivityAt ?? left.updatedAt) ?? 0
    const rightActivity = parseIsoMs(right.lastActivityAt ?? right.updatedAt) ?? 0
    if (leftActivity !== rightActivity) {
      return rightActivity - leftActivity
    }

    return left.runId.localeCompare(right.runId)
  })
}

export function buildTournamentLiveOverviewKpis(summaries: TournamentLiveSummary[]) {
  return {
    openRuns: summaries.filter((summary) => summary.lifecycle === 'Open').length,
    startingSoon: summaries.filter((summary) => summary.startingSoon).length,
    activeMatches: summaries.reduce((total, summary) => total + summary.activeMatches, 0),
    waitingPlayers: summaries.reduce((total, summary) => total + summary.waitingPlayers, 0),
    actionNeeded: summaries.filter((summary) => summary.actionNeeded).length,
    finalizeReady: summaries.filter((summary) => summary.finalizeReady).length,
  }
}

function buildTimelineBuckets(
  timestamps: string[],
  generatedAt: string,
  bucketCount: number,
  bucketHours: number,
): TournamentTimelineBucket[] {
  const nowMs = parseIsoMs(generatedAt) ?? Date.now()
  const bucketWidthMs = bucketHours * 60 * 60 * 1000
  const firstBucketStartMs = nowMs - bucketWidthMs * (bucketCount - 1)

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStartMs = firstBucketStartMs + index * bucketWidthMs
    const bucketEndMs = bucketStartMs + bucketWidthMs

    return {
      bucketStart: new Date(bucketStartMs).toISOString(),
      bucketEnd: new Date(bucketEndMs).toISOString(),
      count: timestamps.reduce((total, timestamp) => {
        const parsed = parseIsoMs(timestamp)
        return parsed !== null && parsed >= bucketStartMs && parsed < bucketEndMs ? total + 1 : total
      }, 0),
    }
  })
}

function buildOverviewActiveMatchesByRound(tournaments: Tournament[]): TournamentActiveMatchesByRound[] {
  const counts = tournaments
    .flatMap((tournament) => buildRoundStats(tournament))
    .reduce<Record<number, number>>((accumulator, round) => {
      accumulator[round.round] = (accumulator[round.round] ?? 0) + round.inMatch
      return accumulator
    }, {})

  return Object.keys(counts)
    .map((round) => ({
      round: Number(round),
      count: counts[Number(round)] ?? 0,
    }))
    .sort((left, right) => left.round - right.round)
}

export function buildTournamentLiveOverviewData(
  tournaments: Tournament[],
  auditEntries: AuditLogEntry[],
  generatedAt = new Date().toISOString(),
): TournamentLiveOverviewData {
  const nowMs = parseIsoMs(generatedAt) ?? Date.now()
  const auditEntriesByRunId = auditEntries.reduce<Record<string, AuditLogEntry[]>>((accumulator, entry) => {
    accumulator[entry.tournamentId] = accumulator[entry.tournamentId] ?? []
    accumulator[entry.tournamentId].push(entry)
    return accumulator
  }, {})

  const summaries = sortTournamentLiveSummariesByUrgency(
    tournaments
      .map((tournament) =>
        buildTournamentLiveSummary(tournament, auditEntriesByRunId[tournament.id] ?? [], generatedAt),
      )
      .filter((summary) => {
        if (summary.lifecycle !== 'Finalized') {
          return true
        }

        const activityMs = parseIsoMs(summary.lastActivityAt ?? summary.finalizedAt ?? summary.updatedAt)
        return activityMs !== null && nowMs - activityMs <= RECENT_RUN_WINDOW_MS
      }),
  )
  const includedRunIds = new Set(summaries.map((summary) => summary.runId))
  const includedTournaments = tournaments.filter((tournament) => includedRunIds.has(tournament.id))

  return {
    generatedAt,
    summaries,
    activeMatchesByRound: buildOverviewActiveMatchesByRound(includedTournaments),
    completionsOverTime: buildTimelineBuckets(
      includedTournaments.flatMap((tournament) =>
        (tournament.bracket?.entries ?? [])
          .map((entry) => entry.completedAt)
          .filter((value): value is string => Boolean(value)),
      ),
      generatedAt,
      OVERVIEW_TIMELINE_BUCKET_COUNT,
      OVERVIEW_TIMELINE_BUCKET_HOURS,
    ),
    auditActivityTimeline: buildTimelineBuckets(
      auditEntries
        .filter((entry) => includedRunIds.has(entry.tournamentId))
        .map((entry) => entry.createdAt),
      generatedAt,
      OVERVIEW_TIMELINE_BUCKET_COUNT,
      OVERVIEW_TIMELINE_BUCKET_HOURS,
    ),
  }
}

function buildMatchDurationBuckets(tournament: Tournament): TournamentMatchDurationBucket[] {
  const durations = (tournament.bracket?.entries ?? [])
    .map((entry) => getEntryDurationSeconds(entry))
    .filter((duration): duration is number => duration !== null)

  const buckets: TournamentMatchDurationBucket[] = [
    { label: '<5m', minSeconds: 0, maxSeconds: 5 * 60, count: 0 },
    { label: '5-10m', minSeconds: 5 * 60, maxSeconds: 10 * 60, count: 0 },
    { label: '10-15m', minSeconds: 10 * 60, maxSeconds: 15 * 60, count: 0 },
    { label: '15-20m', minSeconds: 15 * 60, maxSeconds: 20 * 60, count: 0 },
    { label: '20m+', minSeconds: 20 * 60, maxSeconds: null, count: 0 },
  ]

  durations.forEach((duration) => {
    const bucket =
      buckets.find((candidate) => {
        const minSeconds = candidate.minSeconds ?? 0

        if (candidate.maxSeconds === null) {
          return duration >= minSeconds
        }

        return duration >= minSeconds && duration < candidate.maxSeconds
      }) ?? buckets[buckets.length - 1]

    bucket.count += 1
  })

  return buckets
}

function buildSeedSurvival(tournament: Tournament): TournamentSeedSurvivalPoint[] {
  if (!tournament.bracket || tournament.bracket.participants.length === 0) {
    return []
  }

  const seedByUserId = tournament.bracket.participants.reduce<Record<string, number>>((accumulator, participant) => {
    accumulator[participant.userId] = participant.seed
    return accumulator
  }, {})
  const remainingUserIds = new Set(tournament.bracket.participants.map((participant) => participant.userId))

  return Array.from({ length: tournament.bracket.totalRounds }, (_, index) => index + 1).map((round) => {
    tournament.bracket?.entries
      .filter((entry) => entry.round === round && entry.status === 'completed' && entry.loserUserId)
      .forEach((entry) => {
        if (entry.loserUserId) {
          remainingUserIds.delete(entry.loserUserId)
        }
      })

    const remainingSeeds = Array.from(remainingUserIds)
      .map((userId) => seedByUserId[userId])
      .filter((seed): seed is number => typeof seed === 'number' && Number.isFinite(seed))
      .sort((left, right) => left - right)

    return {
      round,
      label: getRoundLabel(round, tournament.bracket?.totalRounds ?? null),
      survivingCount: remainingSeeds.length,
      topSeedRemaining: remainingSeeds[0] ?? null,
      averageSeedRemaining:
        remainingSeeds.length > 0
          ? Number((remainingSeeds.reduce((total, seed) => total + seed, 0) / remainingSeeds.length).toFixed(2))
          : null,
    }
  })
}

export function buildTournamentLiveDetailData(
  tournament: Tournament,
  auditEntries: AuditLogEntry[],
  generatedAt = new Date().toISOString(),
): TournamentLiveDetailData {
  const nowMs = parseIsoMs(generatedAt) ?? Date.now()

  return {
    generatedAt,
    summary: buildTournamentLiveSummary(tournament, auditEntries, generatedAt),
    roundStats: buildRoundStats(tournament),
    participantStateCounts: buildParticipantStateCounts(tournament),
    liveEntries: buildLiveEntries(tournament, nowMs),
    matchDurationBuckets: buildMatchDurationBuckets(tournament),
    seedSurvival: buildSeedSurvival(tournament),
    auditActivityTimeline: buildTimelineBuckets(
      auditEntries.map((entry) => entry.createdAt),
      generatedAt,
      DETAIL_TIMELINE_BUCKET_COUNT,
      DETAIL_TIMELINE_BUCKET_HOURS,
    ),
  }
}

function buildFallbackStandingsSnapshot(
  tournament: Tournament,
  standings: TournamentStandings,
  exportedAt: string,
) {
  if (tournament.finalSnapshot) {
    return tournament.finalSnapshot
  }

  return {
    generatedAt: standings.generatedAt ?? exportedAt,
    overrideExpiry: 0,
    rankCount: standings.rankCount ?? standings.entries.length,
    records: standings.entries.map((entry) => ({
      rank: entry.rank,
      owner_id: entry.ownerId,
      username: entry.username,
      score: entry.score,
      subscore: entry.subscore,
      num_score: entry.attempts,
      max_num_score: entry.maxAttempts,
      metadata: entry.metadata,
    })),
    prevCursor: null,
    nextCursor: null,
  }
}

function mapTournamentLifecycle(status: TournamentStatus) {
  if (status === 'Open') {
    return 'open'
  }

  if (status === 'Closed') {
    return 'closed'
  }

  if (status === 'Finalized') {
    return 'finalized'
  }

  return 'draft'
}

export function buildTournamentExportFallbackBundle(
  tournament: Tournament,
  standings: TournamentStandings,
  auditEntries: AuditLogEntry[],
  exportedAt = new Date().toISOString(),
): TournamentExportBundle {
  const participantNames = buildParticipantNameMap(tournament)

  return {
    exportedAt,
    run: {
      runId: tournament.id,
      tournamentId: tournament.tournamentId,
      title: tournament.name,
      description: tournament.description,
      lifecycle: mapTournamentLifecycle(tournament.status),
      metadata: tournament.metadata,
      registrations: tournament.registrations,
      bracket: tournament.bracket,
      finalSnapshot: tournament.finalSnapshot,
      openedAt: tournament.openedAt,
      closedAt: tournament.closedAt,
      finalizedAt: tournament.finalizedAt,
      updatedAt: tournament.updatedAt,
    },
    nakamaTournament: {
      id: tournament.tournamentId,
      size: tournament.entrants,
      maxSize: tournament.maxEntrants,
      startTime: Math.floor(new Date(tournament.startAt).getTime() / 1000),
      endTime: tournament.endAt ? Math.floor(new Date(tournament.endAt).getTime() / 1000) : 0,
    },
    standings: buildFallbackStandingsSnapshot(tournament, standings, exportedAt),
    auditEntries: auditEntries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      actorLabel: entry.actor,
      actorUserId: entry.actorUserId,
      tournamentId: entry.tournamentId,
      tournamentName: entry.target,
      createdAt: entry.createdAt,
      metadata: entry.metadata,
    })),
    matchResults: (tournament.bracket?.entries ?? [])
      .filter((entry) => entry.status === 'completed')
      .map((entry) => ({
        resultId: `${tournament.id}:${entry.matchId ?? entry.entryId}`,
        matchId: entry.matchId,
        runId: tournament.id,
        tournamentId: tournament.tournamentId,
        createdAt: entry.completedAt ?? exportedAt,
        updatedAt: entry.completedAt ?? exportedAt,
        valid: true,
        counted: true,
        invalidReason: null,
        errorMessage: null,
        summary: {
          completedAt: entry.completedAt,
          round: entry.round,
          entryId: entry.entryId,
          winnerUserId: entry.winnerUserId,
          loserUserId: entry.loserUserId,
          players: [entry.playerAUserId, entry.playerBUserId]
            .filter((userId): userId is string => Boolean(userId))
            .map((userId) => ({
              userId,
              username: participantNames.get(userId) ?? userId,
              didWin: userId === entry.winnerUserId,
            })),
        },
      })),
  }
}

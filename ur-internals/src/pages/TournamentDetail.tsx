import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getTournamentAuditLog } from '../api/auditLog'
import { getTournamentLiveDetail } from '../api/liveStatus'
import {
  deleteTournament,
  exportTournament,
  finalizeTournament,
  getTournament,
  getTournamentStandings,
  openTournament,
} from '../api/tournaments'
import { useSession } from '../auth/useSession'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { getTournamentStructureLabel } from '../tournamentStructure'
import type { AuditLogEntry } from '../types/audit'
import type {
  Tournament,
  TournamentLiveAlert,
  TournamentLiveDetailData,
  TournamentLiveEntry,
  TournamentStandings,
  TournamentStatus,
  TournamentTimelineBucket,
} from '../types/tournament'

const LIVE_POLL_INTERVAL_MS = 10000

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatTimeAgo(value: string | null) {
  if (!value) {
    return 'No activity'
  }

  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000))

  if (diffMinutes < 1) {
    return 'Just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

function formatBucketLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
  }).format(new Date(value))
}

function formatEntryStatus(status: TournamentLiveEntry['status']) {
  if (status === 'in_match') {
    return 'In match'
  }

  if (status === 'ready') {
    return 'Ready'
  }

  if (status === 'completed') {
    return 'Completed'
  }

  return 'Pending'
}

function describeEntry(entry: TournamentStandings['entries'][number]) {
  const parts = [
    entry.result ? `Result: ${entry.result}` : null,
    entry.round ? `Round ${entry.round}` : null,
    entry.matchId ? `Match ${entry.matchId}` : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' · ') : 'No per-entry metadata yet.'
}

type TournamentHistoryMatch = {
  key: string
  headline: string
  detail: string
}

type TournamentHistoryRound = {
  round: number
  title: string
  summary: string
  matches: TournamentHistoryMatch[]
}

function getRoundStageLabel(round: number, totalRounds: number, matchCount: number) {
  if (round === totalRounds) {
    return 'Final'
  }

  if (matchCount === 2) {
    return 'Semifinals'
  }

  if (matchCount === 4) {
    return 'Quarterfinals'
  }

  return `Round of ${matchCount * 2}`
}

function getHistorySourceLabel(sourceEntryId: string) {
  const match = sourceEntryId.match(/^round-(\d+)-match-(\d+)$/)
  return match ? `Match ${match[2]}` : 'a prior match'
}

function joinLabels(labels: string[]) {
  if (labels.length === 0) {
    return ''
  }

  if (labels.length === 1) {
    return labels[0]
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`
  }

  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}

function resolvePlayerLabel(userId: string | null, playerNames: Map<string, string>) {
  if (!userId) {
    return 'TBD'
  }

  return playerNames.get(userId) ?? userId
}

function describeHistoryMatch(
  tournament: Tournament,
  playerNames: Map<string, string>,
  roundTitle: string,
  slot: number,
) {
  return (entry: NonNullable<Tournament['bracket']>['entries'][number]): TournamentHistoryMatch => {
    const playerA = resolvePlayerLabel(entry.playerAUserId, playerNames)
    const playerB = resolvePlayerLabel(entry.playerBUserId, playerNames)

    if (entry.status === 'completed') {
      const winner = resolvePlayerLabel(entry.winnerUserId, playerNames)
      const loser = resolvePlayerLabel(entry.loserUserId, playerNames)
      const detailParts = [
        entry.completedAt ? `Completed ${formatDateTime(entry.completedAt)}` : null,
        entry.matchId ? `Match id ${entry.matchId}` : null,
      ].filter(Boolean)

      return {
        key: entry.entryId,
        headline:
          entry.winnerUserId && entry.loserUserId
            ? `Match ${slot}: ${winner} defeated ${loser}.`
            : `Match ${slot}: A result was recorded for this ${roundTitle.toLowerCase()} pairing.`,
        detail: detailParts.join(' · ') || `Recorded in ${roundTitle}.`,
      }
    }

    if (entry.status === 'in_match') {
      return {
        key: entry.entryId,
        headline: `Match ${slot}: ${playerA} is currently playing ${playerB}.`,
        detail:
          [
            entry.startedAt ? `Started ${formatDateTime(entry.startedAt)}` : null,
            entry.matchId ? `Match id ${entry.matchId}` : null,
          ]
            .filter(Boolean)
            .join(' · ') || `This ${getTournamentStructureLabel(tournament.gameMode).toLowerCase()} game is in progress.`,
      }
    }

    if (entry.status === 'ready') {
      return {
        key: entry.entryId,
        headline: `Match ${slot}: ${playerA} vs ${playerB} is ready to begin.`,
        detail:
          (entry.readyAt ? `Ready since ${formatDateTime(entry.readyAt)}.` : null) ??
          `Both players have advanced into ${roundTitle.toLowerCase()}.`,
      }
    }

    if (entry.playerAUserId && !entry.playerBUserId) {
      return {
        key: entry.entryId,
        headline: `Match ${slot}: ${playerA} has advanced and is waiting for an opponent.`,
        detail: 'This spot will fill once the prior result is confirmed.',
      }
    }

    if (!entry.playerAUserId && entry.playerBUserId) {
      return {
        key: entry.entryId,
        headline: `Match ${slot}: ${playerB} has advanced and is waiting for an opponent.`,
        detail: 'This spot will fill once the prior result is confirmed.',
      }
    }

    const sourceMatches = joinLabels(entry.sourceEntryIds.map((sourceId) => getHistorySourceLabel(sourceId)))

    return {
      key: entry.entryId,
      headline: `Match ${slot}: This pairing is still waiting to be decided.`,
      detail: sourceMatches
        ? `Waiting for winners from ${sourceMatches}.`
        : 'Waiting for the previous round to settle.',
    }
  }
}

function buildTournamentHistoryRounds(
  tournament: Tournament,
  standings: TournamentStandings,
): TournamentHistoryRound[] {
  if (!tournament.bracket) {
    return []
  }

  const playerNames = new Map<string, string>()
  tournament.bracket.participants.forEach((participant) => {
    playerNames.set(participant.userId, participant.displayName)
  })
  standings.entries.forEach((entry) => {
    if (!playerNames.has(entry.ownerId)) {
      playerNames.set(entry.ownerId, entry.username)
    }
  })

  const rounds = Array.from(new Set(tournament.bracket.entries.map((entry) => entry.round))).sort(
    (left, right) => left - right,
  )

  return rounds.map((round) => {
    const entries = tournament.bracket?.entries
      .filter((entry) => entry.round === round)
      .sort((left, right) => left.slot - right.slot) ?? []
    const roundTitle = `Round ${round} · ${getRoundStageLabel(
      round,
      tournament.bracket?.totalRounds ?? round,
      entries.length,
    )}`
    const completedCount = entries.filter((entry) => entry.status === 'completed').length

    return {
      round,
      title: roundTitle,
      summary: `${completedCount} of ${entries.length} ${entries.length === 1 ? 'result' : 'results'} recorded`,
      matches: entries.map((entry) =>
        describeHistoryMatch(tournament, playerNames, roundTitle, entry.slot)(entry),
      ),
    }
  })
}

function renderAlertStrip(alerts: TournamentLiveAlert[]) {
  if (alerts.length === 0) {
    return <span className="alert-chip alert-chip--info">Quiet</span>
  }

  return (
    <>
      {alerts.map((alert) => (
        <span
          key={alert.code}
          className={`alert-chip alert-chip--${alert.level}`}
          title={alert.message}
        >
          {alert.message}
        </span>
      ))}
    </>
  )
}

function renderProgressRows(
  rows: Array<{
    key: string
    label: string
    valueLabel: string
    progress: number
    hint: string
  }>,
) {
  const maxProgress = Math.max(...rows.map((row) => row.progress), 1)

  return (
    <div className="chart-list">
      {rows.map((row) => (
        <div key={row.key} className="chart-row">
          <div className="chart-row__copy">
            <strong>{row.label}</strong>
            <span>{row.hint}</span>
          </div>
          <div className="chart-row__bar">
            <span
              className="chart-row__fill"
              style={{ width: `${Math.max(6, (row.progress / maxProgress) * 100)}%` }}
            />
          </div>
          <span className="chart-row__value">{row.valueLabel}</span>
        </div>
      ))}
    </div>
  )
}

function renderCountRows(
  rows: Array<{
    key: string
    label: string
    value: number
    hint: string
  }>,
) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1)

  return (
    <div className="chart-list">
      {rows.map((row) => (
        <div key={row.key} className="chart-row">
          <div className="chart-row__copy">
            <strong>{row.label}</strong>
            <span>{row.hint}</span>
          </div>
          <div className="chart-row__bar">
            <span
              className="chart-row__fill"
              style={{ width: `${Math.max(6, (row.value / maxValue) * 100)}%` }}
            />
          </div>
          <span className="chart-row__value">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function renderTimelineChart(
  buckets: TournamentTimelineBucket[],
  emptyLabel: string,
) {
  const maxValue = Math.max(...buckets.map((bucket) => bucket.count), 0)

  if (maxValue === 0) {
    return <div className="empty-state">{emptyLabel}</div>
  }

  return (
    <div className="spark-chart" role="img" aria-label={emptyLabel}>
      {buckets.map((bucket) => (
        <div key={bucket.bucketStart} className="spark-chart__bucket">
          <span className="spark-chart__value">{bucket.count}</span>
          <span className="spark-chart__rail">
            <span
              className="spark-chart__bar"
              style={{ height: `${Math.max(12, (bucket.count / maxValue) * 100)}%` }}
            />
          </span>
          <span className="spark-chart__label">{formatBucketLabel(bucket.bucketStart)}</span>
        </div>
      ))}
    </div>
  )
}

const emptyStandings: TournamentStandings = {
  entries: [],
  rankCount: null,
  generatedAt: null,
}

export function TournamentDetailPage() {
  const { adminIdentity, sessionToken } = useSession()
  const { tournamentId } = useParams()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [liveDetail, setLiveDetail] = useState<TournamentLiveDetailData | null>(null)
  const [standings, setStandings] = useState<TournamentStandings>(emptyStandings)
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpening, setIsOpening] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloadingExport, setIsDownloadingExport] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canDeleteTournaments = adminIdentity?.role === 'admin'
  const canFinalizeTournaments = adminIdentity?.role === 'admin'

  async function loadDetailData(showLoading = true) {
    if (!tournamentId) {
      setError('Missing tournament id.')
      setIsLoading(false)
      return
    }

    if (showLoading) {
      setIsLoading(true)
    }

    setError(null)

    const nextTournament = await getTournament(tournamentId)

    if (!nextTournament) {
      setTournament(null)
      setLiveDetail(null)
      setStandings(emptyStandings)
      setAuditEntries([])
      return
    }

    const nextLiveDetail = await getTournamentLiveDetail(tournamentId)

    const [nextStandings, nextAuditLog] = await Promise.all([
      nextTournament.status === 'Draft'
        ? Promise.resolve(emptyStandings)
        : getTournamentStandings(tournamentId, 100),
      getTournamentAuditLog(tournamentId, 50),
    ])

    setTournament(nextTournament)
    setLiveDetail(nextLiveDetail)
    setStandings(nextStandings)
    setAuditEntries(nextAuditLog)
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        await loadDetailData(true)
      } catch (loadError) {
        if (!active) {
          return
        }

        const message =
          loadError instanceof Error ? loadError.message : 'Unable to load tournament detail.'
        setError(message)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void load()
    const intervalId = window.setInterval(() => {
      if (!active) {
        return
      }

      void loadDetailData(false).catch((loadError) => {
        if (!active) {
          return
        }

        const message =
          loadError instanceof Error ? loadError.message : 'Unable to refresh live tournament status.'
        setError(message)
      })
    }, LIVE_POLL_INTERVAL_MS)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [sessionToken, tournamentId])

  async function handleOpenTournament() {
    if (!tournament) {
      return
    }

    setError(null)
    setIsOpening(true)

    try {
      await openTournament(tournament.id)
      await loadDetailData(false)
    } catch (openError) {
      const message =
        openError instanceof Error ? openError.message : 'Unable to open tournament.'
      setError(message)
    } finally {
      setIsOpening(false)
    }
  }

  async function handleDeleteTournament() {
    if (!tournament) {
      return
    }

    const confirmed =
      typeof window === 'undefined' ||
      window.confirm(
        `Delete "${tournament.name}"? This permanently removes the tournament run from ur-internals and public tournament listings.`,
      )

    if (!confirmed) {
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      await deleteTournament(tournament.id)
      navigate('/tournaments')
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Unable to delete tournament.'
      setError(message)
      setIsDeleting(false)
    }
  }

  async function handleFinalizeTournament() {
    if (!tournament) {
      return
    }

    setError(null)
    setIsFinalizing(true)

    try {
      await finalizeTournament(tournament.id)
      await loadDetailData(false)
    } catch (finalizeError) {
      const message =
        finalizeError instanceof Error ? finalizeError.message : 'Unable to finalize tournament.'
      setError(message)
    } finally {
      setIsFinalizing(false)
    }
  }

  async function handleDownloadExport() {
    if (!tournament || tournament.status !== 'Finalized') {
      return
    }

    setError(null)
    setIsDownloadingExport(true)

    try {
      const bundle = await exportTournament(tournament.id, {
        tournament,
        standings,
        auditEntries,
      })
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: 'application/json',
      })
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${tournament.id}-tournament-export.json`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl)
      }, 0)
    } catch (downloadError) {
      const message =
        downloadError instanceof Error ? downloadError.message : 'Unable to download tournament export.'
      setError(message)
    } finally {
      setIsDownloadingExport(false)
    }
  }

  const historyRounds = useMemo(
    () => (tournament ? buildTournamentHistoryRounds(tournament, standings) : []),
    [standings, tournament],
  )

  if (isLoading) {
    return <div className="empty-state">Loading tournament detail...</div>
  }

  if (error) {
    return <div className="alert alert--error">{error}</div>
  }

  if (!tournament) {
    return (
      <section className="panel stack">
        <PageHeader
          eyebrow="TournamentDetail"
          title="Tournament not found"
          description="The requested run was not returned by the admin API."
          actions={
            <Link to="/tournaments" className="button">
              Back to tournaments
            </Link>
          }
        />
      </section>
    )
  }

  const liveSummary = liveDetail?.summary ?? {
    lifecycle: tournament.status as TournamentStatus,
    alerts: [],
    currentRound: null,
    totalMatches: 0,
    completedMatches: 0,
    activeMatches: 0,
    waitingPlayers: 0,
    lastResultAt: null,
    finalizeReady: false,
    readyMatches: 0,
    pendingMatches: 0,
    entrants: tournament.entrants,
    capacity: tournament.maxEntrants,
  }
  const liveEntries = liveDetail?.liveEntries ?? []
  const queueEntries = liveEntries.filter((entry) => entry.status !== 'completed')
  const blockedEntries = liveEntries.filter((entry) => entry.stale || entry.blockedReason)

  return (
    <>
      <PageHeader
        eyebrow="TournamentDetail"
        title={tournament.name}
        description="Live tournament control room with queue health, round pressure, bracket progress, and finalized export support."
        actions={
          <div className="page-header__actions">
            {tournament.status === 'Draft' ? (
              <button
                className="button button--primary"
                type="button"
                disabled={isOpening || isFinalizing || isDeleting}
                onClick={() => {
                  void handleOpenTournament()
                }}
              >
                {isOpening ? 'Opening...' : 'Open tournament'}
              </button>
            ) : null}
            {canFinalizeTournaments && tournament.status !== 'Draft' && tournament.status !== 'Finalized' ? (
              <button
                className="button button--primary"
                type="button"
                disabled={isOpening || isFinalizing || isDeleting}
                onClick={() => {
                  void handleFinalizeTournament()
                }}
              >
                {isFinalizing ? 'Finalizing...' : 'Finalize tournament'}
              </button>
            ) : null}
            {tournament.status === 'Finalized' ? (
              <button
                className="button"
                type="button"
                disabled={isDeleting || isOpening || isFinalizing || isDownloadingExport}
                onClick={() => {
                  void handleDownloadExport()
                }}
              >
                {isDownloadingExport ? 'Preparing JSON...' : 'Download finalized JSON'}
              </button>
            ) : null}
            {canDeleteTournaments ? (
              <button
                className="button button--danger"
                type="button"
                disabled={isDeleting || isOpening || isFinalizing}
                onClick={() => {
                  void handleDeleteTournament()
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete tournament'}
              </button>
            ) : null}
            <Link to="/tournaments" className="button">
              Back to tournaments
            </Link>
          </div>
        }
      />

      <section className="panel detail-hero">
        <div className="detail-hero__meta">
          <StatusBadge status={liveSummary.lifecycle} />
          <span className="button">{getTournamentStructureLabel(tournament.gameMode)}</span>
          <span className="button">{tournament.operator.toUpperCase()}</span>
          <span className="button mono">{tournament.id}</span>
        </div>
        <p className="detail-hero__summary">{tournament.description}</p>
        <div className="alert-chip-row">{renderAlertStrip(liveSummary.alerts)}</div>

        <div className="metric-grid">
          <div className="metric-card">
            <span className="meta-label">Lifecycle</span>
            <strong>{liveSummary.lifecycle}</strong>
          </div>
          <div className="metric-card">
            <span className="meta-label">Round progress</span>
            <strong>
              {liveSummary.totalMatches > 0
                ? `${liveSummary.completedMatches}/${liveSummary.totalMatches}`
                : 'Not seeded'}
            </strong>
          </div>
          <div className="metric-card">
            <span className="meta-label">Active matches</span>
            <strong>{liveSummary.activeMatches}</strong>
          </div>
          <div className="metric-card">
            <span className="meta-label">Waiting players</span>
            <strong>{liveSummary.waitingPlayers}</strong>
          </div>
          <div className="metric-card">
            <span className="meta-label">Last result</span>
            <strong>{liveSummary.lastResultAt ? formatTimeAgo(liveSummary.lastResultAt) : 'No results yet'}</strong>
          </div>
          <div className="metric-card">
            <span className="meta-label">Finalize readiness</span>
            <strong>{liveSummary.finalizeReady ? 'Ready now' : 'Still live'}</strong>
          </div>
        </div>
      </section>

      <section className="panel stack">
        <div className="panel__header">
          <div>
            <h3 className="panel__title">Live bracket by round</h3>
            <span className="panel__subtitle">Pending, ready, active, and completed counts grouped by round.</span>
          </div>
          <span className="muted">Polling every 10s</span>
        </div>

        {!liveDetail || liveDetail.roundStats.length === 0 ? (
          <div className="empty-state">
            {tournament.bracket
              ? 'Round stats are still being assembled for this run.'
              : 'Bracket stats appear once the field locks and pairings are seeded.'}
          </div>
        ) : (
          <div className="round-ops-grid">
            {liveDetail.roundStats.map((round) => (
              <article key={round.round} className="round-ops-card">
                <div className="round-ops-card__header">
                  <div>
                    <strong>{round.label}</strong>
                    <span>{round.completionPercent}% complete</span>
                  </div>
                  <span className="round-ops-card__badge">
                    {round.completed}/{round.totalMatches}
                  </span>
                </div>
                <div className="round-ops-card__counts">
                  <span>
                    Pending
                    <strong>{round.pending}</strong>
                  </span>
                  <span>
                    Ready
                    <strong>{round.ready}</strong>
                  </span>
                  <span>
                    In match
                    <strong>{round.inMatch}</strong>
                  </span>
                  <span>
                    Completed
                    <strong>{round.completed}</strong>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Participant state breakdown</h3>
              <span className="panel__subtitle">Where players currently sit in the bracket lifecycle.</span>
            </div>
          </div>

          {renderCountRows([
            {
              key: 'lobby',
              label: 'Lobby',
              value: liveDetail?.participantStateCounts.lobby ?? 0,
              hint: 'Registered but not yet assigned',
            },
            {
              key: 'in_match',
              label: 'In match',
              value: liveDetail?.participantStateCounts.inMatch ?? 0,
              hint: 'Players currently playing',
            },
            {
              key: 'waiting',
              label: 'Waiting next round',
              value: liveDetail?.participantStateCounts.waitingNextRound ?? 0,
              hint: 'Advanced players waiting on the bracket',
            },
            {
              key: 'eliminated',
              label: 'Eliminated',
              value: liveDetail?.participantStateCounts.eliminated ?? 0,
              hint: 'Players already knocked out',
            },
            {
              key: 'runner_up',
              label: 'Runner-up',
              value: liveDetail?.participantStateCounts.runnerUp ?? 0,
              hint: 'Finalist locked in',
            },
            {
              key: 'champion',
              label: 'Champion',
              value: liveDetail?.participantStateCounts.champion ?? 0,
              hint: 'Winning slot',
            },
          ])}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Round completion by round</h3>
              <span className="panel__subtitle">Progress pressure across the current bracket.</span>
            </div>
          </div>

          {!liveDetail || liveDetail.roundStats.length === 0 ? (
            <div className="empty-state">No round completion data yet.</div>
          ) : (
            renderProgressRows(
              liveDetail.roundStats.map((round) => ({
                key: String(round.round),
                label: round.label,
                valueLabel: `${round.completed}/${round.totalMatches}`,
                progress: round.completionPercent,
                hint:
                  round.totalMatches > 0
                    ? `${round.totalMatches - round.completed} unresolved matches`
                    : 'No pairings yet',
              })),
            )
          )}
        </article>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Match duration distribution</h3>
              <span className="panel__subtitle">Histogram of completed match durations.</span>
            </div>
          </div>

          {!liveDetail || liveDetail.matchDurationBuckets.every((bucket) => bucket.count === 0) ? (
            <div className="empty-state">Completed matches will populate duration buckets here.</div>
          ) : (
            renderCountRows(
              liveDetail.matchDurationBuckets.map((bucket) => ({
                key: bucket.label,
                label: bucket.label,
                value: bucket.count,
                hint: bucket.count === 1 ? '1 completed match' : `${bucket.count} completed matches`,
              })),
            )
          )}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Seed survival</h3>
              <span className="panel__subtitle">How quickly higher seeds are falling out by round.</span>
            </div>
          </div>

          {!liveDetail || liveDetail.seedSurvival.length === 0 ? (
            <div className="empty-state">Seed survival appears after the bracket is seeded.</div>
          ) : (
            renderCountRows(
              liveDetail.seedSurvival.map((point) => ({
                key: String(point.round),
                label: point.label,
                value: point.survivingCount,
                hint:
                  point.topSeedRemaining !== null
                    ? `Top seed remaining: #${point.topSeedRemaining}`
                    : 'No seeds remaining yet',
              })),
            )
          )}
        </article>
      </section>

      <section className="split-grid">
        <article className="panel stack">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Match queue</h3>
              <span className="panel__subtitle">Live ready, pending, and active bracket entries.</span>
            </div>
          </div>

          {queueEntries.length === 0 ? (
            <div className="empty-state">No queued or active matches right now.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Status</th>
                    <th>Players</th>
                    <th>Context</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {queueEntries.map((entry) => (
                    <tr key={entry.entryId}>
                      <td>
                        <div className="stack stack--compact">
                          <strong>Round {entry.round}</strong>
                          <span className="muted mono">{entry.entryId}</span>
                        </div>
                      </td>
                      <td>{formatEntryStatus(entry.status)}</td>
                      <td>
                        {entry.playerADisplayName ?? 'TBD'} vs {entry.playerBDisplayName ?? 'TBD'}
                      </td>
                      <td>{entry.blockedReason ?? entry.staleReason ?? 'Healthy queue state'}</td>
                      <td>
                        {formatDateTime(
                          entry.startedAt ?? entry.readyAt ?? entry.completedAt ?? null,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="panel stack">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Blocked / stale states</h3>
              <span className="panel__subtitle">Entries that need a launch, an upstream result, or manual investigation.</span>
            </div>
          </div>

          {blockedEntries.length === 0 ? (
            <div className="empty-state">No blocked or stale states detected.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Entry</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {blockedEntries.map((entry) => (
                    <tr key={`${entry.entryId}-blocked`}>
                      <td>
                        <div className="stack stack--compact">
                          <strong>Round {entry.round}</strong>
                          <span className="muted mono">{entry.entryId}</span>
                        </div>
                      </td>
                      <td>{entry.stale ? 'Stale' : formatEntryStatus(entry.status)}</td>
                      <td>{entry.staleReason ?? entry.blockedReason ?? 'Operator review needed'}</td>
                      <td>{formatDateTime(entry.startedAt ?? entry.readyAt ?? null)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="split-grid">
        <article className="panel stack">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Bracket history</h3>
              <span className="panel__subtitle">Round-by-round summaries for recent and completed pairings.</span>
            </div>
          </div>

          {historyRounds.length === 0 ? (
            <div className="empty-state">
              {tournament.bracket
                ? 'Bracket history is still being assembled for this run.'
                : 'Round history appears once the field locks and bracket pairings are created.'}
            </div>
          ) : (
            <div className="history-rounds">
              {historyRounds.map((round) => (
                <details
                  key={round.round}
                  className="history-round"
                  open={round.round === historyRounds[historyRounds.length - 1]?.round}
                >
                  <summary className="history-round__summary">
                    <div className="history-round__summary-copy">
                      <strong>{round.title}</strong>
                      <span className="muted">{round.summary}</span>
                    </div>
                    <span className="history-round__toggle">Details</span>
                  </summary>

                  <ul className="history-round__list">
                    {round.matches.map((match) => (
                      <li key={match.key} className="history-round__item">
                        <strong>{match.headline}</strong>
                        <span className="muted">{match.detail}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          )}
        </article>

        <article className="panel stack">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Audit activity timeline</h3>
              <span className="panel__subtitle">Recent operator activity for this run only.</span>
            </div>
          </div>

          {renderTimelineChart(
            liveDetail?.auditActivityTimeline ?? [],
            'No audit activity recorded in the current time window.',
          )}
        </article>
      </section>

      <section className="split-grid">
        <article className="panel stack">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Standings</h3>
              <span className="panel__subtitle">
                {standings.generatedAt
                  ? `Generated ${formatDateTime(standings.generatedAt)}`
                  : 'No standings snapshot yet.'}
              </span>
            </div>
          </div>

          {standings.entries.length === 0 ? (
            <div className="empty-state">
              {tournament.status === 'Draft'
                ? 'Draft runs stay hidden from public players until you open the tournament.'
                : 'No standings entries returned for this run.'}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Score</th>
                    <th>Subscore</th>
                    <th>Counted matches</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.entries.map((entry) => (
                    <tr key={`${entry.ownerId}-${entry.rank ?? 'na'}`}>
                      <td>{entry.rank ?? '-'}</td>
                      <td>
                        <div className="stack stack--compact">
                          <strong>{entry.username}</strong>
                          <span className="muted mono">{entry.ownerId}</span>
                        </div>
                      </td>
                      <td>{entry.score}</td>
                      <td>{entry.subscore}</td>
                      <td>
                        {entry.attempts ?? 0}
                        {entry.maxAttempts ? ` / ${entry.maxAttempts}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="panel stack">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Audit trace</h3>
              <span className="panel__subtitle">Per-run audit entries from the admin log.</span>
            </div>
          </div>

          {auditEntries.length === 0 ? (
            <div className="empty-state">No audit entries returned for this run.</div>
          ) : (
            <ul className="list">
              {auditEntries.map((entry) => (
                <li key={entry.id} className="list__item">
                  <div className="list__meta">
                    <strong>{entry.action}</strong>
                    <span>{formatDateTime(entry.createdAt)}</span>
                  </div>
                  <span>{entry.summary}</span>
                  <span className="muted">
                    {entry.actor} · {entry.target}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="panel stack">
        <div className="panel__header">
          <div>
            <h3 className="panel__title">Entry records</h3>
            <span className="panel__subtitle">Last written tournament record metadata per owner.</span>
          </div>
        </div>

        {standings.entries.length === 0 ? (
          <div className="empty-state">No entry records available yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Summary</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {standings.entries.map((entry) => (
                  <tr key={`${entry.ownerId}-entry`}>
                    <td>{entry.username}</td>
                    <td>{describeEntry(entry)}</td>
                    <td>{formatDateTime(entry.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

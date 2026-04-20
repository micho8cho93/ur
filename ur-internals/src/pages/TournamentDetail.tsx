import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { ActionToolbar } from '../components/ActionToolbar'
import { EmptyState } from '../components/EmptyState'
import { Skeleton, SkeletonCard, SkeletonTable } from '../components/Skeleton'
import { MetaStrip, MetaStripItem } from '../components/MetaStrip'
import { PageHeader } from '../components/PageHeader'
import { SectionPanel } from '../components/SectionPanel'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { appRoutes } from '../routes'
import { formatTournamentBotSummary } from '../tournamentBots'
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

function getEntrySignalClassName(entry: TournamentLiveEntry) {
  if (entry.stale) {
    return 'signal-badge signal-badge--danger'
  }

  if (entry.blockedReason) {
    return 'signal-badge signal-badge--warning'
  }

  if (entry.status === 'in_match') {
    return 'signal-badge signal-badge--success'
  }

  if (entry.status === 'ready') {
    return 'signal-badge signal-badge--accent'
  }

  return 'signal-badge'
}

function getEntrySignalLabel(entry: TournamentLiveEntry) {
  if (entry.stale) {
    return 'Stale'
  }

  if (entry.blockedReason) {
    return 'Blocked'
  }

  return formatEntryStatus(entry.status)
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

type TournamentPlayerDirectory = {
  names: Map<string, string>
  seeds: Map<string, number>
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

function buildTournamentPlayerDirectory(
  tournament: Tournament,
  standings: TournamentStandings,
): TournamentPlayerDirectory {
  const names = new Map<string, string>()
  const seeds = new Map<string, number>()

  tournament.registrations.forEach((registration) => {
    names.set(registration.userId, registration.displayName)
    seeds.set(registration.userId, registration.seed)
  })

  tournament.bracket?.participants.forEach((participant) => {
    names.set(participant.userId, participant.displayName)
    seeds.set(participant.userId, participant.seed)
  })

  standings.entries.forEach((entry) => {
    if (!names.has(entry.ownerId)) {
      names.set(entry.ownerId, entry.username)
    }
  })

  return {
    names,
    seeds,
  }
}

function resolvePlayerLabel(
  userId: string | null,
  playerDirectory: TournamentPlayerDirectory,
  preferredLabel?: string | null,
) {
  const normalizedPreferred = preferredLabel?.trim()
  if (normalizedPreferred) {
    return normalizedPreferred
  }

  if (!userId) {
    return 'TBD'
  }

  const fallbackLabel = playerDirectory.names.get(userId)?.trim()
  if (fallbackLabel) {
    return fallbackLabel
  }

  const seed = playerDirectory.seeds.get(userId)
  return seed ? `Seed #${seed}` : 'Qualified player'
}

function resolveBracketEntryPlayerLabel(
  entry: NonNullable<Tournament['bracket']>['entries'][number],
  slot: 'playerA' | 'playerB',
  playerDirectory: TournamentPlayerDirectory,
) {
  if (slot === 'playerA') {
    return resolvePlayerLabel(entry.playerAUserId, playerDirectory, entry.playerAUsername)
  }

  return resolvePlayerLabel(entry.playerBUserId, playerDirectory, entry.playerBUsername)
}

function resolveLiveEntryPlayerLabel(
  entry: TournamentLiveEntry,
  slot: 'playerA' | 'playerB',
  playerDirectory: TournamentPlayerDirectory,
) {
  if (slot === 'playerA') {
    return resolvePlayerLabel(entry.playerAUserId, playerDirectory, entry.playerADisplayName)
  }

  return resolvePlayerLabel(entry.playerBUserId, playerDirectory, entry.playerBDisplayName)
}

function getBracketEntryScoreline(entry: NonNullable<Tournament['bracket']>['entries'][number]) {
  if (typeof entry.playerAScore !== 'number' || typeof entry.playerBScore !== 'number') {
    return null
  }

  if (entry.winnerUserId === entry.playerAUserId) {
    return `${entry.playerAScore}-${entry.playerBScore}`
  }

  if (entry.winnerUserId === entry.playerBUserId) {
    return `${entry.playerBScore}-${entry.playerAScore}`
  }

  return `${entry.playerAScore}-${entry.playerBScore}`
}

function describeHistoryMatch(
  tournament: Tournament,
  playerDirectory: TournamentPlayerDirectory,
  roundTitle: string,
  slot: number,
) {
  return (entry: NonNullable<Tournament['bracket']>['entries'][number]): TournamentHistoryMatch => {
    const playerA = resolveBracketEntryPlayerLabel(entry, 'playerA', playerDirectory)
    const playerB = resolveBracketEntryPlayerLabel(entry, 'playerB', playerDirectory)

    if (entry.status === 'completed') {
      const winner =
        entry.winnerUserId === entry.playerAUserId
          ? playerA
          : entry.winnerUserId === entry.playerBUserId
            ? playerB
            : resolvePlayerLabel(entry.winnerUserId, playerDirectory)
      const loser =
        entry.loserUserId === entry.playerAUserId
          ? playerA
          : entry.loserUserId === entry.playerBUserId
            ? playerB
            : resolvePlayerLabel(entry.loserUserId, playerDirectory)
      const scoreline = getBracketEntryScoreline(entry)
      const detailParts = [
        entry.completedAt ? `Completed ${formatDateTime(entry.completedAt)}` : null,
        entry.matchId ? `Match id ${entry.matchId}` : null,
      ].filter(Boolean)

      return {
        key: entry.entryId,
        headline:
          entry.winnerUserId && entry.loserUserId
            ? `Match ${slot}: ${winner} defeated ${loser}${scoreline ? ` (${scoreline})` : ''}.`
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

  const playerDirectory = buildTournamentPlayerDirectory(tournament, standings)

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
        describeHistoryMatch(tournament, playerDirectory, roundTitle, entry.slot)(entry),
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
    return (
      <EmptyState
        title="No timeline activity"
        description={emptyLabel}
        compact
      />
    )
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

  const loadDetailData = useCallback(async (showLoading = true) => {
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

    const [nextLiveDetail, nextStandings, nextAuditLog] = await Promise.all([
      getTournamentLiveDetail(tournamentId),
      nextTournament.status === 'Draft'
        ? Promise.resolve(emptyStandings)
        : getTournamentStandings(tournamentId, 100),
      getTournamentAuditLog(tournamentId, 50),
    ])

    setTournament(nextTournament)
    setLiveDetail(nextLiveDetail)
    setStandings(nextStandings)
    setAuditEntries(nextAuditLog)
  }, [tournamentId])

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
  }, [loadDetailData, sessionToken])

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
      navigate(appRoutes.tournaments.runs)
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
  const playerDirectory = useMemo(
    () =>
      tournament
        ? buildTournamentPlayerDirectory(tournament, standings)
        : { names: new Map<string, string>(), seeds: new Map<string, number>() },
    [standings, tournament],
  )

  if (isLoading) {
    return (
      <>
        <section className="panel stack">
          <div className="stack">
            <Skeleton height="12px" width="140px" />
            <Skeleton height="26px" width="260px" />
            <Skeleton height="13px" width="65%" />
          </div>
          <div className="kpi-grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </section>
        <SkeletonTable columns={6} rows={8} />
      </>
    )
  }

  if (error) {
    return <div className="alert alert--error">{error}</div>
  }

  if (!tournament) {
    return (
      <section className="panel stack">
        <PageHeader
          eyebrow="Tournament Detail"
          title="Tournament not found"
          description="The requested run was not returned by the admin API."
          actions={
            <Link to={appRoutes.tournaments.runs} className="button button--secondary">
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
  const fieldFillPercent = Math.round((liveSummary.entrants / Math.max(1, liveSummary.capacity)) * 100)
  const finalizeReadinessLabel =
    liveSummary.finalizeReady || tournament.status === 'Finalized' ? 'Ready' : 'In progress'

  return (
    <>
      <section className="control-hero">
        <div className="control-hero__header">
          <div className="control-hero__copy">
            <p className="page-header__eyebrow">Tournament Detail</p>
            <h2>{tournament.name}</h2>
            <p className="page-header__description">
              Live tournament control room with queue health, round pressure, bracket progress, and finalized export support.
            </p>
          </div>

          <ActionToolbar className="action-toolbar--wrap">
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
                className="button button--secondary"
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
            <Link to={appRoutes.tournaments.runs} className="button button--secondary">
              Back to tournaments
            </Link>
          </ActionToolbar>
        </div>

        <MetaStrip className="meta-strip--compact meta-strip--hero">
          <MetaStripItem
            label="Lifecycle"
            value={<StatusBadge status={liveSummary.lifecycle} />}
            hint={liveSummary.finalizeReady ? 'Finalization window open.' : 'Current tournament state.'}
            tone={liveSummary.finalizeReady ? 'success' : 'accent'}
          />
          <MetaStripItem
            label="Format"
            value={getTournamentStructureLabel(tournament.gameMode)}
            hint={`${tournament.roundCount} rounds configured`}
          />
          <MetaStripItem
            label="Entry fee"
            value={tournament.buyIn}
            hint={tournament.buyIn === 'Free' ? 'No wallet deduction on join.' : 'Charged on the first successful join.'}
          />
          <MetaStripItem
            label="Operator"
            value={tournament.operator.toUpperCase()}
            hint={tournament.authoritative ? 'Authoritative tournament run' : 'Non-authoritative tournament run'}
          />
          <MetaStripItem
            label="Run id"
            value={<span className="mono">{tournament.id}</span>}
            hint={tournament.tournamentId !== tournament.id ? `Tournament id ${tournament.tournamentId}` : 'Primary run identifier'}
          />
          <MetaStripItem
            label="Field"
            value={`${liveSummary.entrants}/${liveSummary.capacity}`}
            hint={`${fieldFillPercent}% registered`}
          />
          <MetaStripItem
            label="Bots"
            value={formatTournamentBotSummary(tournament)}
            hint={tournament.bots.count > 0 ? 'Inserted bot seats are already present in this run.' : 'Stored bot fill policy for this tournament.'}
          />
          <MetaStripItem
            label="Start"
            value={formatDateTime(tournament.startAt)}
            hint={tournament.openedAt ? `Opened ${formatDateTime(tournament.openedAt)}` : 'Not opened yet'}
          />
        </MetaStrip>

        {tournament.description ? <p className="control-hero__summary">{tournament.description}</p> : null}
        <div className="alert-chip-row control-hero__alerts">{renderAlertStrip(liveSummary.alerts)}</div>

        <section className="stats-grid" aria-label="Tournament KPIs">
          <StatCard
            label="Lifecycle state"
            value={liveSummary.lifecycle}
            helper={liveSummary.finalizeReady ? 'Ready to finalize.' : 'Current bracket lifecycle.'}
            tone="accent"
          />
          <StatCard
            label="Round progress"
            value={
              liveSummary.totalMatches > 0
                ? `${liveSummary.completedMatches}/${liveSummary.totalMatches}`
                : 'Not seeded'
            }
            helper={liveSummary.currentRound ? `Current round ${liveSummary.currentRound}.` : 'Bracket not seeded yet.'}
          />
          <StatCard
            label="Active matches"
            value={String(liveSummary.activeMatches)}
            helper="Live matches currently in progress."
            tone="success"
          />
          <StatCard
            label="Waiting players"
            value={String(liveSummary.waitingPlayers)}
            helper="Advanced players awaiting resolution."
          />
          <StatCard
            label="Last result"
            value={liveSummary.lastResultAt ? formatTimeAgo(liveSummary.lastResultAt) : 'No results'}
            helper={liveSummary.lastResultAt ? formatDateTime(liveSummary.lastResultAt) : 'No completed match recorded yet.'}
          />
          <StatCard
            label="Finalize readiness"
            value={finalizeReadinessLabel}
            helper={tournament.status === 'Finalized' ? 'Finalized export available.' : 'Tracks completion and closeout state.'}
            tone={liveSummary.finalizeReady || tournament.status === 'Finalized' ? 'success' : 'warning'}
          />
        </section>
      </section>

      <SectionPanel
        title="Live bracket by round"
        subtitle="Pending, ready, active, and completed counts grouped by round."
        actions={<span className="panel__status-note">Polling every 10s</span>}
      >
        {!liveDetail || liveDetail.roundStats.length === 0 ? (
          <EmptyState
            title="Round data unavailable"
            description={
              tournament.bracket
                ? 'Round stats are still being assembled for this run.'
                : 'Bracket stats appear once the field locks and pairings are seeded.'
            }
            compact
          />
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
      </SectionPanel>

      <section className="split-grid">
        <SectionPanel
          title="Participant state breakdown"
          subtitle="Where players currently sit in the bracket lifecycle."
        >
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
        </SectionPanel>

        <SectionPanel
          title="Round completion by round"
          subtitle="Progress pressure across the current bracket."
        >
          {!liveDetail || liveDetail.roundStats.length === 0 ? (
            <EmptyState
              title="No round completion data"
              description="Round completion appears after bracket pairings are available."
              compact
            />
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
        </SectionPanel>
      </section>

      <section className="split-grid">
        <SectionPanel
          title="Match duration distribution"
          subtitle="Histogram of completed match durations."
          collapsible
          defaultOpen={false}
        >
          {!liveDetail || liveDetail.matchDurationBuckets.every((bucket) => bucket.count === 0) ? (
            <EmptyState
              title="No duration distribution yet"
              description="Completed matches will populate duration buckets here."
              compact
            />
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
        </SectionPanel>

        <SectionPanel
          title="Seed survival"
          subtitle="How quickly higher seeds are falling out by round."
          collapsible
          defaultOpen={false}
        >
          {!liveDetail || liveDetail.seedSurvival.length === 0 ? (
            <EmptyState
              title="Seed survival unavailable"
              description="Seed survival appears after the bracket is seeded."
              compact
            />
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
        </SectionPanel>
      </section>

      <section className="split-grid">
        <SectionPanel
          title="Match queue"
          subtitle="Live ready, pending, and active bracket entries."
        >
          {queueEntries.length === 0 ? (
            <EmptyState
              title="Queue is clear"
              description="No queued or active matches are waiting right now."
              compact
            />
          ) : (
            <div className="table-wrap table-wrap--edge">
              <table className="table table--dense table--operations">
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
                    <tr
                      key={entry.entryId}
                      className={
                        entry.stale
                          ? 'table__row table__row--critical'
                          : entry.blockedReason
                            ? 'table__row table__row--warning'
                            : 'table__row'
                      }
                    >
                      <td>
                        <div className="table__entity">
                          <div className="stack stack--compact">
                            <strong>Round {entry.round}</strong>
                            <span className="muted mono">{entry.entryId}</span>
                          </div>
                          <span className="table__subline">Slot {entry.slot}</span>
                        </div>
                      </td>
                      <td>
                        <span className={getEntrySignalClassName(entry)}>
                          {getEntrySignalLabel(entry)}
                        </span>
                      </td>
                      <td>
                        <div className="table__entity">
                          <strong>
                            {resolveLiveEntryPlayerLabel(entry, 'playerA', playerDirectory)} vs{' '}
                            {resolveLiveEntryPlayerLabel(entry, 'playerB', playerDirectory)}
                          </strong>
                          <span className="table__subline mono">
                            {entry.matchId ? `Match ${entry.matchId}` : 'Match id pending'}
                          </span>
                        </div>
                      </td>
                      <td>{entry.blockedReason ?? entry.staleReason ?? 'Healthy queue state'}</td>
                      <td>
                        <div className="stack stack--compact">
                          <strong>{formatDateTime(entry.startedAt ?? entry.readyAt ?? entry.completedAt ?? null)}</strong>
                          <span className="muted">
                            {entry.startedAt
                              ? 'Started'
                              : entry.readyAt
                                ? 'Ready'
                                : 'Awaiting launch'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionPanel>

        <SectionPanel
          title="Blocked / stale states"
          subtitle="Entries that need a launch, an upstream result, or manual investigation."
          collapsible
          defaultOpen={blockedEntries.length > 0}
        >
          {blockedEntries.length === 0 ? (
            <EmptyState
              title="No blocked states"
              description="No blocked or stale states are currently detected."
              compact
              tone="success"
            />
          ) : (
            <div className="table-wrap table-wrap--edge">
              <table className="table table--dense table--operations">
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
                    <tr
                      key={`${entry.entryId}-blocked`}
                      className={entry.stale ? 'table__row table__row--critical' : 'table__row table__row--warning'}
                    >
                      <td>
                        <div className="table__entity">
                          <div className="stack stack--compact">
                            <strong>Round {entry.round}</strong>
                            <span className="muted mono">{entry.entryId}</span>
                          </div>
                          <span className="table__subline">Slot {entry.slot}</span>
                        </div>
                      </td>
                      <td>
                        <span className={getEntrySignalClassName(entry)}>{getEntrySignalLabel(entry)}</span>
                      </td>
                      <td>{entry.staleReason ?? entry.blockedReason ?? 'Operator review needed'}</td>
                      <td>
                        <div className="stack stack--compact">
                          <strong>{formatDateTime(entry.startedAt ?? entry.readyAt ?? null)}</strong>
                          <span className="muted">
                            {entry.stale ? 'Exceeded healthy window' : 'Waiting for upstream resolution'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionPanel>
      </section>

      <section className="split-grid">
        <SectionPanel
          title="Bracket history"
          subtitle="Round-by-round summaries for recent and completed pairings."
        >
          {historyRounds.length === 0 ? (
            <EmptyState
              title="Bracket history unavailable"
              description={
                tournament.bracket
                  ? 'Bracket history is still being assembled for this run.'
                  : 'Round history appears once the field locks and bracket pairings are created.'
              }
              compact
            />
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
        </SectionPanel>

        <SectionPanel
          title="Audit activity timeline"
          subtitle="Recent operator activity for this run only."
          collapsible
          defaultOpen={false}
        >
          {renderTimelineChart(
            liveDetail?.auditActivityTimeline ?? [],
            'No audit activity recorded in the current time window.',
          )}
        </SectionPanel>
      </section>

      <section className="split-grid">
        <SectionPanel
          title="Standings"
          subtitle={
            standings.generatedAt
              ? `Generated ${formatDateTime(standings.generatedAt)}`
              : 'No standings snapshot yet.'
          }
          collapsible
          defaultOpen={false}
        >
          {standings.entries.length === 0 ? (
            <EmptyState
              title="No standings snapshot"
              description={
                tournament.status === 'Draft'
                  ? 'Draft runs stay hidden from public players until you open the tournament.'
                  : 'No standings entries were returned for this run.'
              }
              compact
            />
          ) : (
            <div className="table-wrap table-wrap--edge">
              <table className="table table--dense table--operations">
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
                    <tr key={`${entry.ownerId}-${entry.rank ?? 'na'}`} className="table__row">
                      <td>{entry.rank ?? '-'}</td>
                      <td>
                        <div className="table__entity">
                          <div className="stack stack--compact">
                            <strong>{entry.username}</strong>
                            <span className="muted mono">{entry.ownerId}</span>
                          </div>
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
        </SectionPanel>

        <SectionPanel
          title="Audit trace"
          subtitle="Per-run audit entries from the admin log."
          collapsible
          defaultOpen={false}
        >
          {auditEntries.length === 0 ? (
            <EmptyState
              title="No audit trace entries"
              description="No audit entries were returned for this run."
              compact
            />
          ) : (
            <ul className="list list--dense">
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
        </SectionPanel>
      </section>

      <SectionPanel
        title="Entry records"
        subtitle="Last written tournament record metadata per owner."
        collapsible
        defaultOpen={false}
      >
        {standings.entries.length === 0 ? (
          <EmptyState
            title="No entry records yet"
            description="Entry records will appear here after the tournament begins writing standings metadata."
            compact
          />
        ) : (
          <div className="table-wrap table-wrap--edge">
            <table className="table table--dense table--operations">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Summary</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {standings.entries.map((entry) => (
                  <tr key={`${entry.ownerId}-entry`} className="table__row">
                    <td>
                      <div className="table__entity">
                        <div className="stack stack--compact">
                          <strong>{entry.username}</strong>
                          <span className="muted mono">{entry.ownerId}</span>
                        </div>
                      </div>
                    </td>
                    <td>{describeEntry(entry)}</td>
                    <td>
                      <div className="stack stack--compact">
                        <strong>{formatDateTime(entry.updatedAt)}</strong>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionPanel>
    </>
  )
}

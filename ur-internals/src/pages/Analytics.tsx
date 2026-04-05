import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  createDefaultAnalyticsFilters,
  formatDateLabel,
  formatDateTime,
  formatDurationSeconds,
  formatNumber,
  formatPercent,
  formatTimeAgo,
  trimGameModeLabel,
} from '../analytics/utils'
import {
  getAnalyticsDashboardBundle,
  getAnalyticsRealtime,
  listAnalyticsTournamentFilterOptions,
} from '../api/analytics'
import { useSession } from '../auth/useSession'
import { ActionToolbar } from '../components/ActionToolbar'
import { TabNav } from '../components/TabNav'
import {
  AnalyticsBarChart,
  AnalyticsFunnelChart,
  AnalyticsLineChart,
} from '../components/analytics/AnalyticsCharts'
import { AnalyticsChartCard } from '../components/analytics/AnalyticsChartCard'
import { AnalyticsFilters } from '../components/analytics/AnalyticsFilters'
import { AnalyticsPageShell } from '../components/analytics/AnalyticsPageShell'
import { AnalyticsStatCard } from '../components/analytics/AnalyticsStatCard'
import {
  AnalyticsTableCard,
  type AnalyticsTableColumn,
} from '../components/analytics/AnalyticsTableCard'
import { AnalyticsUnavailableState } from '../components/analytics/AnalyticsUnavailableState'
import { EmptyState } from '../components/EmptyState'
import { RealtimeStatusCard } from '../components/analytics/RealtimeStatusCard'
import env from '../config/env'
import { analyticsSectionNavItems } from '../routes'
import type {
  AnalyticsAvailability,
  AnalyticsDashboardBundle,
  AnalyticsMetric,
  AnalyticsQueryFilters,
  AnalyticsRealtimeData,
  AnalyticsResponse,
  AnalyticsSectionId,
  AnalyticsTableRow,
} from '../types/analytics'

const CHART_COLORS = {
  blue: 'var(--chart-blue)',
  indigo: 'var(--chart-indigo)',
  teal: 'var(--chart-teal)',
  amber: 'var(--chart-amber)',
  rose: 'var(--chart-rose)',
} as const

function getMetricNumber(row: AnalyticsTableRow, key: string) {
  const value = row.metrics[key]
  return typeof value === 'number' ? value : null
}

function getMetricString(row: AnalyticsTableRow, key: string) {
  const value = row.metrics[key]
  return typeof value === 'string' ? value : null
}

function buildDerivedMetric(
  value: number | null,
  availability: AnalyticsAvailability,
  previousValue: number | null = null,
): AnalyticsMetric {
  return {
    value,
    numerator: null,
    denominator: null,
    previousValue,
    availability,
  }
}

function sumCountPoints(points: Array<{ value: number }>) {
  return points.reduce((sum, point) => sum + point.value, 0)
}

function sumBuckets(buckets: Array<{ count: number }>) {
  return buckets.reduce((sum, bucket) => sum + bucket.count, 0)
}

function getLatestMedianDelta(
  points: Array<{ medianAbsoluteDelta: number | null }>,
) {
  const latest = [...points]
    .reverse()
    .find((point) => typeof point.medianAbsoluteDelta === 'number')

  return latest?.medianAbsoluteDelta ?? null
}

function collectBundleNotes(
  bundle: AnalyticsDashboardBundle | null,
  realtime: AnalyticsResponse<AnalyticsRealtimeData> | null,
) {
  const notes = new Set<string>()

  if (env.useMockData) {
    notes.add(
      'Mock mode may be enabled elsewhere in UR Internals, but analytics surfaces only render live backend data.',
    )
  }

  if (bundle) {
    ;[
      bundle.summary,
      bundle.overview,
      bundle.players,
      bundle.gameplay,
      bundle.tournaments,
      bundle.progression,
    ].forEach((response) => {
      response.dataAvailability.notes.forEach((note) => notes.add(note))
    })
  }

  realtime?.dataAvailability.notes.forEach((note) => notes.add(note))

  return Array.from(notes).slice(0, 3)
}

function buildGameModeOptions(
  bundle: AnalyticsDashboardBundle | null,
  tournamentOptions: Array<{ gameMode: string | null }>,
) {
  const options = new Set<string>()

  tournamentOptions.forEach((option) => {
    if (option.gameMode) {
      options.add(option.gameMode)
    }
  })

  bundle?.gameplay.data.winRateByMode.segments.forEach((segment) => {
    if (segment.label) {
      options.add(segment.label)
    }
  })

  bundle?.tournaments.data.recentTournaments.rows.forEach((row) => {
    if (row.secondaryLabel) {
      options.add(row.secondaryLabel)
    }
  })

  return Array.from(options).sort((left, right) => left.localeCompare(right))
}

function buildGeneratedAt(
  bundle: AnalyticsDashboardBundle | null,
  realtime: AnalyticsResponse<AnalyticsRealtimeData> | null,
) {
  const timestamps = [
    bundle?.summary.generatedAt,
    bundle?.overview.generatedAt,
    bundle?.players.generatedAt,
    bundle?.gameplay.generatedAt,
    bundle?.tournaments.generatedAt,
    bundle?.progression.generatedAt,
    realtime?.generatedAt,
  ].filter((value): value is string => typeof value === 'string')

  return timestamps.sort().at(-1) ?? null
}

function buildRangeLabel(filters: AnalyticsQueryFilters) {
  return `${formatDateLabel(filters.startDate)} to ${formatDateLabel(filters.endDate)}`
}

function buildFocusLabel(
  filters: AnalyticsQueryFilters,
  tournamentOptions: Array<{ id: string; label: string }>,
) {
  const tournamentLabel =
    tournamentOptions.find((option) => option.id === filters.tournamentId)?.label ?? null
  const modeLabel = filters.gameMode ? trimGameModeLabel(filters.gameMode) : null

  if (tournamentLabel && modeLabel) {
    return `${tournamentLabel} · ${modeLabel}`
  }

  if (tournamentLabel) {
    return tournamentLabel
  }

  if (modeLabel) {
    return modeLabel
  }

  return 'All tournaments · all modes'
}

function RealtimeEventTable({
  title,
  subtitle,
  rows,
  emptyState,
}: {
  title: string
  subtitle: string
  rows: AnalyticsRealtimeData['recentEvents']['rows']
  emptyState: string
}) {
  return (
    <article className="analytics-card analytics-card--table">
      <header className="analytics-card__header">
        <div className="analytics-card__copy">
          <strong>{title}</strong>
          <p>{subtitle}</p>
        </div>
      </header>

      <div className="analytics-card__body">
        {rows.length === 0 ? (
          <AnalyticsUnavailableState
            availability={{
              status: 'no_data',
              hasData: false,
              sampleSize: 0,
              notes: [emptyState],
            }}
          />
        ) : (
          <div className="table-wrap table-wrap--edge">
            <table className="table analytics-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Detail</th>
                  <th>Occurred</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="stack stack--compact">
                        <strong>{row.label}</strong>
                        <span className="muted mono">{row.type}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`analytics-status-pill analytics-status-pill--${row.status}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.detail ?? '—'}</td>
                    <td>
                      <div className="stack stack--compact">
                        <strong>{formatTimeAgo(row.occurredAt)}</strong>
                        <span className="muted">{formatDateTime(row.occurredAt)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </article>
  )
}

function InlineSummaryList({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: Array<{ key: string; label: string; value: string; hint: string }>
}) {
  return (
    <article className="analytics-card analytics-card--stats">
      <header className="analytics-card__header">
        <div className="analytics-card__copy">
          <strong>{title}</strong>
          <p>{subtitle}</p>
        </div>
      </header>

      <div className="analytics-inline-list">
        {items.map((item) => (
          <div key={item.key} className="analytics-inline-list__row">
            <div className="analytics-inline-list__copy">
              <strong>{item.label}</strong>
              <span>{item.hint}</span>
            </div>
            <span className="analytics-inline-list__value">{item.value}</span>
          </div>
        ))}
      </div>
    </article>
  )
}

export function AnalyticsPage() {
  const { sectionId } = useParams()
  const { sessionToken } = useSession()
  const [filters, setFilters] = useState<AnalyticsQueryFilters>(() =>
    createDefaultAnalyticsFilters(),
  )
  const [bundle, setBundle] = useState<AnalyticsDashboardBundle | null>(null)
  const [realtime, setRealtime] = useState<AnalyticsResponse<AnalyticsRealtimeData> | null>(
    null,
  )
  const [tournamentOptions, setTournamentOptions] = useState<
    Array<{ id: string; label: string; gameMode: string | null }>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRealtimeLoading, setIsRealtimeLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realtimeError, setRealtimeError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [realtimeRefreshTick, setRealtimeRefreshTick] = useState(0)
  const [autoRefreshRealtime, setAutoRefreshRealtime] = useState(true)

  const activeSection =
    analyticsSectionNavItems.find((item) => item.id === sectionId) ??
    analyticsSectionNavItems[0]
  const activeSectionId = activeSection.id as AnalyticsSectionId

  useEffect(() => {
    let active = true

    async function loadTournamentOptions() {
      try {
        const nextOptions = await listAnalyticsTournamentFilterOptions()

        if (!active) {
          return
        }

        setTournamentOptions(nextOptions)
      } catch (loadError) {
        if (!active) {
          return
        }

        console.warn('Unable to load analytics tournament filters', loadError)
        setTournamentOptions([])
      }
    }

    void loadTournamentOptions()

    return () => {
      active = false
    }
  }, [sessionToken])

  useEffect(() => {
    let active = true

    async function loadBundle() {
      setIsLoading(true)
      setError(null)

      try {
        const nextBundle = await getAnalyticsDashboardBundle(filters)

        if (!active) {
          return
        }

        setBundle(nextBundle)
      } catch (loadError) {
        if (!active) {
          return
        }

        const message =
          loadError instanceof Error ? loadError.message : 'Unable to load analytics.'
        setError(message)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadBundle()

    return () => {
      active = false
    }
  }, [filters, refreshTick, sessionToken])

  useEffect(() => {
    let active = true
    let intervalId: number | null = null

    async function loadRealtime() {
      setIsRealtimeLoading(true)
      setRealtimeError(null)

      try {
        const nextRealtime = await getAnalyticsRealtime(filters)

        if (!active) {
          return
        }

        setRealtime(nextRealtime)
      } catch (loadError) {
        if (!active) {
          return
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load realtime analytics.'
        setRealtimeError(message)
      } finally {
        if (active) {
          setIsRealtimeLoading(false)
        }
      }
    }

    void loadRealtime()

    if (autoRefreshRealtime) {
      intervalId = window.setInterval(() => {
        void loadRealtime()
      }, 20000)
    }

    return () => {
      active = false
      if (intervalId !== null) {
        window.clearInterval(intervalId)
      }
    }
  }, [autoRefreshRealtime, filters, realtimeRefreshTick, sessionToken])

  const notes = useMemo(() => collectBundleNotes(bundle, realtime), [bundle, realtime])
  const generatedAt = useMemo(() => buildGeneratedAt(bundle, realtime), [bundle, realtime])
  const rangeLabel = useMemo(() => buildRangeLabel(filters), [filters])
  const gameModeOptions = useMemo(
    () => buildGameModeOptions(bundle, tournamentOptions),
    [bundle, tournamentOptions],
  )
  const focusLabel = useMemo(
    () => buildFocusLabel(filters, tournamentOptions),
    [filters, tournamentOptions],
  )

  const topPlayerColumns: AnalyticsTableColumn[] = [
    {
      key: 'player',
      label: 'Player',
      accessor: (row) => row.label,
      render: (row) => (
        <div className="stack stack--compact">
          <strong>{row.label}</strong>
          <span className="muted">{row.secondaryLabel ?? 'Rank unavailable'}</span>
        </div>
      ),
    },
    {
      key: 'matchesPlayed',
      label: 'Matches',
      accessor: (row) => getMetricNumber(row, 'matchesPlayed'),
    },
    {
      key: 'winRate',
      label: 'Win rate',
      accessor: (row) => getMetricNumber(row, 'winRate'),
      render: (row) => formatPercent(getMetricNumber(row, 'winRate')),
    },
    {
      key: 'elo',
      label: 'Elo',
      accessor: (row) => getMetricNumber(row, 'elo'),
      render: (row) => formatNumber(getMetricNumber(row, 'elo')),
    },
    {
      key: 'tournamentParticipations',
      label: 'Tournament entries',
      accessor: (row) => getMetricNumber(row, 'tournamentParticipations'),
    },
    {
      key: 'lastActiveAt',
      label: 'Last active',
      accessor: (row) => getMetricString(row, 'lastActiveAt'),
      render: (row) => {
        const value = getMetricString(row, 'lastActiveAt')
        return (
          <div className="stack stack--compact">
            <strong>{formatTimeAgo(value)}</strong>
            <span className="muted">{formatDateTime(value)}</span>
          </div>
        )
      },
    },
  ]

  const recentMatchesColumns: AnalyticsTableColumn[] = [
    {
      key: 'winner',
      label: 'Winner',
      accessor: (row) => row.label,
      render: (row) => (
        <div className="stack stack--compact">
          <strong>{getMetricString(row, 'winner') ?? row.label}</strong>
          <span className="muted">
            {getMetricString(row, 'loser') ?? 'Opponent unavailable'}
          </span>
        </div>
      ),
    },
    {
      key: 'mode',
      label: 'Mode',
      accessor: (row) => row.secondaryLabel,
      render: (row) => trimGameModeLabel(row.secondaryLabel),
    },
    {
      key: 'reason',
      label: 'Result',
      accessor: (row) => getMetricString(row, 'reason'),
    },
    {
      key: 'durationSeconds',
      label: 'Duration',
      accessor: (row) => getMetricNumber(row, 'durationSeconds'),
      render: (row) => formatDurationSeconds(getMetricNumber(row, 'durationSeconds')),
    },
    {
      key: 'totalMoves',
      label: 'Moves',
      accessor: (row) => getMetricNumber(row, 'totalMoves'),
    },
    {
      key: 'endedAt',
      label: 'Finished',
      accessor: (row) => getMetricString(row, 'endedAt'),
      render: (row) => formatDateTime(getMetricString(row, 'endedAt')),
    },
  ]

  const recentTournamentColumns: AnalyticsTableColumn[] = [
    {
      key: 'name',
      label: 'Tournament',
      accessor: (row) => row.label,
      render: (row) => (
        <div className="stack stack--compact">
          <strong>{row.label}</strong>
          <span className="muted">{trimGameModeLabel(row.secondaryLabel)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      accessor: (row) => getMetricString(row, 'status'),
    },
    {
      key: 'entrants',
      label: 'Entrants',
      accessor: (row) => getMetricNumber(row, 'entrants'),
    },
    {
      key: 'completionRate',
      label: 'Bracket completion',
      accessor: (row) => getMetricNumber(row, 'completionRate'),
      render: (row) => formatPercent(getMetricNumber(row, 'completionRate')),
    },
    {
      key: 'finalizedAt',
      label: 'Finalized',
      accessor: (row) => getMetricString(row, 'finalizedAt'),
      render: (row) => formatDateTime(getMetricString(row, 'finalizedAt')),
    },
  ]

  const recentRankUpColumns: AnalyticsTableColumn[] = [
    {
      key: 'player',
      label: 'Player',
      accessor: (row) => row.label,
      render: (row) => (
        <div className="stack stack--compact">
          <strong>{row.label}</strong>
          <span className="muted">{row.secondaryLabel ?? 'Rank unavailable'}</span>
        </div>
      ),
    },
    {
      key: 'awardedXp',
      label: 'XP awarded',
      accessor: (row) => getMetricNumber(row, 'awardedXp'),
    },
    {
      key: 'source',
      label: 'Source',
      accessor: (row) => getMetricString(row, 'source'),
    },
    {
      key: 'previousRank',
      label: 'From',
      accessor: (row) => getMetricString(row, 'previousRank'),
    },
    {
      key: 'occurredAt',
      label: 'Occurred',
      accessor: (row) => getMetricString(row, 'occurredAt'),
      render: (row) => formatDateTime(getMetricString(row, 'occurredAt')),
    },
  ]

  const overviewNewPlayersMetric = bundle
    ? buildDerivedMetric(
        sumCountPoints(
          bundle.overview.data.newVsReturningPlayers.points.map((point) => ({
            value: point.primary,
          })),
        ),
        bundle.overview.data.newVsReturningPlayers.availability,
      )
    : null

  const overviewReturningPlayersMetric = bundle
    ? buildDerivedMetric(
        sumCountPoints(
          bundle.overview.data.newVsReturningPlayers.points.map((point) => ({
            value: point.secondary,
          })),
        ),
        bundle.overview.data.newVsReturningPlayers.availability,
      )
    : null

  const totalNewPlayersMetric = bundle
    ? buildDerivedMetric(
        sumCountPoints(bundle.players.data.newPlayersOverTime.points),
        bundle.players.data.newPlayersOverTime.availability,
      )
    : null

  const totalReturningPlayersMetric = bundle
    ? buildDerivedMetric(
        sumCountPoints(bundle.players.data.returningPlayersOverTime.points),
        bundle.players.data.returningPlayersOverTime.availability,
      )
    : null

  const startedMatchesMetric = bundle
    ? buildDerivedMetric(
        bundle.gameplay.data.startedVsCompleted.points.reduce(
          (sum, point) => sum + point.started,
          0,
        ),
        bundle.gameplay.data.startedVsCompleted.availability,
      )
    : null

  const ratedPlayersMetric = bundle
    ? buildDerivedMetric(
        sumBuckets(bundle.progression.data.eloDistribution.buckets),
        bundle.progression.data.eloDistribution.availability,
      )
    : null

  const rankedPlayersMetric = bundle
    ? buildDerivedMetric(
        sumBuckets(bundle.progression.data.rankDistribution.buckets),
        bundle.progression.data.rankDistribution.availability,
      )
    : null

  const xpIssuedMetric = bundle
    ? buildDerivedMetric(
        sumCountPoints(bundle.progression.data.xpAwardedOverTime.points),
        bundle.progression.data.xpAwardedOverTime.availability,
      )
    : null

  const medianRatingDeltaMetric = bundle
    ? buildDerivedMetric(
        getLatestMedianDelta(bundle.progression.data.ratingMovement.points),
        bundle.progression.data.ratingMovement.availability,
      )
    : null

  const recentRankUpsMetric = bundle
    ? buildDerivedMetric(
        bundle.progression.data.recentRankUps.rows.length,
        bundle.progression.data.recentRankUps.availability,
      )
    : null

  const headerActions = (
    <ActionToolbar>
      {activeSectionId === 'realtime' ? (
        <>
          <label className="analytics-toggle">
            <input
              type="checkbox"
              checked={autoRefreshRealtime}
              onChange={(event) => {
                setAutoRefreshRealtime(event.target.checked)
              }}
            />
            <span>Auto-refresh</span>
          </label>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => {
              setRealtimeRefreshTick((current) => current + 1)
            }}
            disabled={isRealtimeLoading}
          >
            {isRealtimeLoading ? 'Refreshing realtime...' : 'Refresh realtime'}
          </button>
        </>
      ) : null}
      <button
        className="button button--secondary"
        type="button"
        onClick={() => {
          setRefreshTick((current) => current + 1)
          setRealtimeRefreshTick((current) => current + 1)
        }}
      >
        Refresh all
      </button>
    </ActionToolbar>
  )

  let sectionBody: React.ReactNode = null

  if (activeSectionId === 'realtime') {
    sectionBody = realtime ? (
      <>
        <section className="analytics-kpi-grid" aria-label="Realtime operations KPIs">
          <AnalyticsStatCard
            label="Current players online"
            metric={realtime.data.onlinePlayers}
            helper="Live presence count from the current runtime snapshot."
          />
          <AnalyticsStatCard
            label="Live matches"
            metric={realtime.data.activeMatches}
            helper="Matches currently tracked as active."
          />
          <AnalyticsStatCard
            label="Active tournaments"
            metric={realtime.data.activeTournaments}
            helper="Runs currently open or still resolving."
          />
          <AnalyticsStatCard
            label="Queue pressure"
            metric={realtime.data.queueSize}
            helper="Queue backlog when that runtime signal is available."
          />
          <AnalyticsStatCard
            label="Queue wait"
            metric={realtime.data.queueWaitSeconds}
            helper="Current queue wait signal."
            format="duration"
          />
        </section>

        <div className="analytics-grid analytics-grid--2col">
          <article className="analytics-card analytics-card--table">
            <header className="analytics-card__header">
              <div className="analytics-card__copy">
                <strong>Live match list</strong>
                <p>Current tracked matches with mode, tournament context, and player labels.</p>
              </div>
            </header>

            <div className="analytics-card__body">
              {realtime.data.activeMatchRows.rows.length === 0 ? (
                <AnalyticsUnavailableState availability={realtime.data.activeMatchRows.availability} />
              ) : (
                <div className="table-wrap table-wrap--edge">
                  <table className="table analytics-table">
                    <thead>
                      <tr>
                        <th>Match</th>
                        <th>Mode</th>
                        <th>Players</th>
                        <th>Started</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realtime.data.activeMatchRows.rows.map((row) => (
                        <tr key={row.matchId}>
                          <td className="mono">{row.matchId}</td>
                          <td>{trimGameModeLabel(row.modeId)}</td>
                          <td>{row.playerLabels.join(' vs ')}</td>
                          <td>
                            <div className="stack stack--compact">
                              <strong>{formatTimeAgo(row.startedAt)}</strong>
                              <span className="muted">{formatDateTime(row.startedAt)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </article>

          <article className="analytics-card analytics-card--stats">
            <header className="analytics-card__header">
              <div className="analytics-card__copy">
                <strong>Freshness</strong>
                <p>How recent the live analytics signal is before you rely on it operationally.</p>
              </div>
            </header>

            <div className="analytics-mini-stats">
              <article className="realtime-status-card">
                <span className="meta-label">Generated</span>
                <strong>{formatTimeAgo(realtime.data.freshness.generatedAt)}</strong>
                <span>{formatDateTime(realtime.data.freshness.generatedAt)}</span>
              </article>
              <article className="realtime-status-card">
                <span className="meta-label">Last event</span>
                <strong>{formatTimeAgo(realtime.data.freshness.lastEventAt)}</strong>
                <span>{formatDateTime(realtime.data.freshness.lastEventAt)}</span>
              </article>
            </div>
          </article>
        </div>

        <div className="analytics-grid analytics-grid--2col">
          <RealtimeEventTable
            title="Recent events"
            subtitle="Most recent tracked match and progression events."
            rows={realtime.data.recentEvents.rows}
            emptyState="No recent analytics events have been recorded yet."
          />
          <RealtimeEventTable
            title="Recent disconnects"
            subtitle="Disconnect and inactivity forfeits from tracked live matches."
            rows={realtime.data.recentDisconnects.rows}
            emptyState="No recent disconnect or inactivity forfeits have been recorded."
          />
        </div>
      </>
    ) : (
      <EmptyState
        title={isRealtimeLoading ? 'Loading realtime analytics' : 'Realtime analytics unavailable'}
        description={
          isRealtimeLoading
            ? 'Collecting the latest live presence, match, and event telemetry.'
            : 'No realtime analytics response was returned for the current filters.'
        }
        compact
        tone={isRealtimeLoading ? 'info' : 'warning'}
      />
    )
  } else if (isLoading || !bundle) {
    sectionBody = (
      <EmptyState
        title={isLoading ? 'Loading analytics view' : 'Analytics view unavailable'}
        description={
          isLoading
            ? 'Fetching the current analytics bundle for the selected filters.'
            : 'No analytics data was returned for this view.'
        }
        compact
        tone={isLoading ? 'info' : 'warning'}
      />
    )
  } else if (activeSectionId === 'overview') {
    sectionBody = (
      <>
        <section className="analytics-kpi-grid" aria-label="Executive summary KPIs">
          <AnalyticsStatCard
            label="DAU"
            metric={bundle.summary.data.dau}
            helper="Distinct active players in the latest day of the selected window."
          />
          <AnalyticsStatCard
            label="WAU"
            metric={bundle.summary.data.wau}
            helper="Distinct players active across the trailing 7-day window."
          />
          <AnalyticsStatCard
            label="Matches played"
            metric={bundle.summary.data.matchesPlayed}
            helper="Matches ending in this reporting range."
          />
          <AnalyticsStatCard
            label="Completion rate"
            metric={bundle.summary.data.completionRate}
            helper="Started matches that reached a proper finish."
            format="percent"
          />
          <AnalyticsStatCard
            label="Players online"
            metric={bundle.summary.data.currentOnlinePlayers}
            helper="Current live presence snapshot from the runtime."
          />
          <AnalyticsStatCard
            label="Tournaments completed"
            metric={bundle.summary.data.tournamentsCompleted}
            helper="Runs finalized in the selected window."
          />
          <AnalyticsStatCard
            label="Disconnect rate"
            metric={bundle.summary.data.disconnectRate}
            helper="Disconnect or inactivity forfeits among started matches."
            format="percent"
          />
        </section>

        <div className="analytics-grid analytics-grid--2col">
          <AnalyticsChartCard
            title="Daily active users"
            subtitle="The raw daily active line for quick leadership and operator scanning."
            availability={bundle.overview.data.dauTrend.availability}
          >
            <AnalyticsLineChart
              labels={bundle.overview.data.dauTrend.points.map((point) =>
                formatDateLabel(point.date),
              )}
              series={[
                {
                  key: 'dau',
                  label: 'DAU',
                  color: CHART_COLORS.blue,
                  values: bundle.overview.data.dauTrend.points.map((point) => point.value),
                },
              ]}
            />
          </AnalyticsChartCard>

          <AnalyticsChartCard
            title="Matches played by day"
            subtitle="Daily match throughput for the selected operational window."
            availability={bundle.overview.data.matchesPerDay.availability}
          >
            <AnalyticsLineChart
              labels={bundle.overview.data.matchesPerDay.points.map((point) =>
                formatDateLabel(point.date),
              )}
              series={[
                {
                  key: 'matches',
                  label: 'Matches',
                  color: CHART_COLORS.teal,
                  values: bundle.overview.data.matchesPerDay.points.map((point) => point.value),
                },
              ]}
            />
          </AnalyticsChartCard>

          <article className="analytics-card analytics-card--stats">
            <header className="analytics-card__header">
              <div className="analytics-card__copy">
                <strong>Range totals</strong>
                <p>Compact totals to help interpret the headline charts in low-volume periods.</p>
              </div>
            </header>

            <div className="analytics-mini-stats analytics-mini-stats--4up">
              <RealtimeStatusCard
                label="Active players"
                metric={bundle.overview.data.totalPlayers}
                helper="Unique players with recorded activity in the selected range."
              />
              <RealtimeStatusCard
                label="Tournaments created"
                metric={bundle.overview.data.tournamentsCreated}
                helper="Runs created during the selected window."
              />
              <RealtimeStatusCard
                label="New players"
                metric={overviewNewPlayersMetric ?? bundle.summary.data.dau}
                helper="Observed first-seen players inside the current range."
              />
              <RealtimeStatusCard
                label="Returning players"
                metric={overviewReturningPlayersMetric ?? bundle.summary.data.wau}
                helper="Observed returning players inside the current range."
              />
            </div>
          </article>
        </div>
      </>
    )
  } else if (activeSectionId === 'players') {
    sectionBody = (
      <>
        <section className="analytics-kpi-grid" aria-label="Player growth KPIs">
          <AnalyticsStatCard
            label="Unique players"
            metric={bundle.players.data.uniquePlayers}
            helper="Distinct players active in the selected range."
          />
          <AnalyticsStatCard
            label="New players"
            metric={totalNewPlayersMetric ?? bundle.players.data.uniquePlayers}
            helper="Observed first-time players inside the selected window."
          />
          <AnalyticsStatCard
            label="Returning players"
            metric={totalReturningPlayersMetric ?? bundle.players.data.uniquePlayers}
            helper="Observed repeat players inside the selected window."
          />
          <AnalyticsStatCard
            label="D1 retention"
            metric={bundle.players.data.retention.d1}
            helper="Returned exactly one day after first observed activity."
            format="percent"
          />
          <AnalyticsStatCard
            label="D7 retention"
            metric={bundle.players.data.retention.d7}
            helper="Returned exactly seven days after first observed activity."
            format="percent"
          />
        </section>

        <div className="analytics-grid analytics-grid--2col">
          <AnalyticsChartCard
            title="New players over time"
            subtitle="First-seen players by day using real observed activity."
            availability={bundle.players.data.newPlayersOverTime.availability}
          >
            <AnalyticsLineChart
              labels={bundle.players.data.newPlayersOverTime.points.map((point) =>
                formatDateLabel(point.date),
              )}
              series={[
                {
                  key: 'newPlayers',
                  label: 'New players',
                  color: CHART_COLORS.blue,
                  values: bundle.players.data.newPlayersOverTime.points.map(
                    (point) => point.value,
                  ),
                },
              ]}
            />
          </AnalyticsChartCard>

          <AnalyticsChartCard
            title="Returning players over time"
            subtitle="Players active after their first observed day, shown without smoothing."
            availability={bundle.players.data.returningPlayersOverTime.availability}
          >
            <AnalyticsLineChart
              labels={bundle.players.data.returningPlayersOverTime.points.map((point) =>
                formatDateLabel(point.date),
              )}
              series={[
                {
                  key: 'returningPlayers',
                  label: 'Returning players',
                  color: CHART_COLORS.indigo,
                  values: bundle.players.data.returningPlayersOverTime.points.map(
                    (point) => point.value,
                  ),
                },
              ]}
            />
          </AnalyticsChartCard>

          {bundle.players.data.retention.availability.hasData ? (
            <article className="analytics-card analytics-card--stats">
              <header className="analytics-card__header">
                <div className="analytics-card__copy">
                  <strong>Retention snapshot</strong>
                  <p>D1, D7, and D30 only render when the cohort is mature enough to say something honest.</p>
                </div>
              </header>

              <div className="analytics-mini-stats">
                <RealtimeStatusCard
                  label="D1 retention"
                  metric={bundle.players.data.retention.d1}
                  helper="One day return."
                  format="percent"
                />
                <RealtimeStatusCard
                  label="D7 retention"
                  metric={bundle.players.data.retention.d7}
                  helper="Seven day return."
                  format="percent"
                />
                <RealtimeStatusCard
                  label="D30 retention"
                  metric={bundle.players.data.retention.d30}
                  helper="Thirty day return."
                  format="percent"
                />
              </div>
            </article>
          ) : (
            <AnalyticsUnavailableState availability={bundle.players.data.retention.availability} />
          )}

          <InlineSummaryList
            title="Activity buckets"
            subtitle="Lightweight engagement split for early-stage player behavior."
            items={bundle.players.data.activityBuckets.buckets.map((bucket) => ({
              key: bucket.key,
              label: bucket.label,
              value: formatNumber(bucket.count),
              hint: bucket.count === 1 ? '1 player' : `${formatNumber(bucket.count)} players`,
            }))}
          />
        </div>

        <AnalyticsTableCard
          title="Most engaged players"
          subtitle="Sorted from real match activity, with win rate, Elo, and tournament participation in view."
          availability={bundle.players.data.topPlayers.availability}
          columns={topPlayerColumns}
          rows={bundle.players.data.topPlayers.rows}
          defaultSortKey="matchesPlayed"
        />
      </>
    )
  } else if (activeSectionId === 'gameplay') {
    sectionBody = (
      <>
        <section className="analytics-kpi-grid" aria-label="Match health KPIs">
          <AnalyticsStatCard
            label="Matches played"
            metric={bundle.summary.data.matchesPlayed}
            helper="Completed or terminated matches ending in this range."
          />
          <AnalyticsStatCard
            label="Started matches"
            metric={startedMatchesMetric ?? bundle.summary.data.matchesPlayed}
            helper="Matches that entered the tracked start state."
          />
          <AnalyticsStatCard
            label="Completion rate"
            metric={bundle.summary.data.completionRate}
            helper="Started matches that finished correctly."
            format="percent"
          />
          <AnalyticsStatCard
            label="Median duration"
            metric={bundle.summary.data.medianMatchDurationSeconds}
            helper="Median duration across completed matches."
            format="duration"
          />
          <AnalyticsStatCard
            label="Disconnect rate"
            metric={bundle.gameplay.data.disconnectRate}
            helper="Disconnect or inactivity forfeits among started matches."
            format="percent"
          />
        </section>

        <div className="analytics-grid analytics-grid--2col">
          <AnalyticsChartCard
            title="Started vs completed"
            subtitle="A raw daily split showing where volume is stalling before completion."
            availability={bundle.gameplay.data.startedVsCompleted.availability}
          >
            <AnalyticsBarChart
              labels={bundle.gameplay.data.startedVsCompleted.points.map((point) =>
                formatDateLabel(point.date),
              )}
              series={[
                {
                  key: 'started',
                  label: 'Started',
                  color: CHART_COLORS.blue,
                  values: bundle.gameplay.data.startedVsCompleted.points.map(
                    (point) => point.started,
                  ),
                },
                {
                  key: 'completed',
                  label: 'Completed',
                  color: CHART_COLORS.teal,
                  values: bundle.gameplay.data.startedVsCompleted.points.map(
                    (point) => point.completed,
                  ),
                },
              ]}
            />
          </AnalyticsChartCard>

          <AnalyticsChartCard
            title="Completion funnel"
            subtitle="The narrowest operational question here: do started matches end cleanly?"
            availability={bundle.gameplay.data.completionFunnel.availability}
          >
            <AnalyticsFunnelChart
              steps={[
                {
                  key: 'started',
                  label: 'Match started',
                  value: bundle.gameplay.data.completionFunnel.started,
                },
                {
                  key: 'completed',
                  label: 'Match finished',
                  value: bundle.gameplay.data.completionFunnel.completed,
                  tone: 'success',
                },
                {
                  key: 'disconnect',
                  label: 'Disconnect forfeit',
                  value: bundle.gameplay.data.completionFunnel.disconnect,
                  tone: 'danger',
                },
                {
                  key: 'inactivity',
                  label: 'Inactivity forfeit',
                  value: bundle.gameplay.data.completionFunnel.inactivity,
                  tone: 'warning',
                },
              ]}
            />
          </AnalyticsChartCard>

          <article className="analytics-card analytics-card--stats">
            <header className="analytics-card__header">
              <div className="analytics-card__copy">
                <strong>Reliability snapshot</strong>
                <p>Compact operational signals that help explain match health without crowding the page.</p>
              </div>
            </header>

            <div className="analytics-mini-stats">
              <RealtimeStatusCard
                label="Disconnect rate"
                metric={bundle.gameplay.data.disconnectRate}
                helper={
                  bundle.gameplay.data.disconnectRate.numerator !== null &&
                  bundle.gameplay.data.disconnectRate.denominator !== null
                    ? `${formatNumber(bundle.gameplay.data.disconnectRate.numerator)}/${formatNumber(bundle.gameplay.data.disconnectRate.denominator)} started matches`
                    : 'Started-match denominator unavailable'
                }
                format="percent"
              />
              <RealtimeStatusCard
                label="Capture telemetry"
                metric={bundle.gameplay.data.captureRate}
                helper="Average captures per tracked match when capture telemetry exists."
                format="raw"
              />
            </div>
          </article>

          <InlineSummaryList
            title="Duration buckets"
            subtitle="Observed spread of completed match durations."
            items={bundle.gameplay.data.durationDistribution.buckets.map((bucket) => ({
              key: bucket.key,
              label: bucket.label,
              value: formatNumber(bucket.count),
              hint:
                bucket.count === 1
                  ? '1 completed match'
                  : `${formatNumber(bucket.count)} completed matches`,
            }))}
          />
        </div>

        <AnalyticsTableCard
          title="Recent match endings"
          subtitle="Recent completions and early terminations with duration and move counts."
          availability={bundle.gameplay.data.recentMatches.availability}
          columns={recentMatchesColumns}
          rows={bundle.gameplay.data.recentMatches.rows}
          defaultSortKey="endedAt"
        />
      </>
    )
  } else if (activeSectionId === 'tournaments') {
    sectionBody = (
      <>
        <section className="analytics-kpi-grid" aria-label="Tournament performance KPIs">
          <AnalyticsStatCard
            label="Runs created"
            metric={bundle.overview.data.tournamentsCreated}
            helper="Runs created during the selected window."
          />
          <AnalyticsStatCard
            label="Active runs"
            metric={bundle.summary.data.activeTournaments}
            helper="Runs currently open or not yet finalized."
          />
          <AnalyticsStatCard
            label="Runs finalized"
            metric={bundle.summary.data.tournamentsCompleted}
            helper="Runs finalized during the selected window."
          />
          <AnalyticsStatCard
            label="Completion rate"
            metric={bundle.tournaments.data.completionRate}
            helper="Created runs that later finalized."
            format="percent"
          />
        </section>

        <div className="analytics-grid analytics-grid--2col">
          <AnalyticsChartCard
            title="Runs created over time"
            subtitle="Tournament creation cadence for the selected range."
            availability={bundle.tournaments.data.createdOverTime.availability}
          >
            <AnalyticsLineChart
              labels={bundle.tournaments.data.createdOverTime.points.map((point) =>
                formatDateLabel(point.date),
              )}
              series={[
                {
                  key: 'created',
                  label: 'Created',
                  color: CHART_COLORS.blue,
                  values: bundle.tournaments.data.createdOverTime.points.map(
                    (point) => point.value,
                  ),
                },
              ]}
            />
          </AnalyticsChartCard>

          <AnalyticsChartCard
            title="Participation counts"
            subtitle="Current tournament field sizes, which matter more than aggregate vanity totals at this scale."
            availability={bundle.tournaments.data.participationCounts.availability}
          >
            <AnalyticsBarChart
              labels={bundle.tournaments.data.participationCounts.buckets.map(
                (bucket) => bucket.label,
              )}
              series={[
                {
                  key: 'participation',
                  label: 'Tournaments',
                  color: CHART_COLORS.teal,
                  values: bundle.tournaments.data.participationCounts.buckets.map(
                    (bucket) => bucket.count,
                  ),
                },
              ]}
            />
          </AnalyticsChartCard>

          <article className="analytics-card analytics-card--stats">
            <header className="analytics-card__header">
              <div className="analytics-card__copy">
                <strong>Completion snapshot</strong>
                <p>Keep the denominator visible so small tournament samples stay interpretable.</p>
              </div>
            </header>

            <div className="analytics-mini-stats">
              <RealtimeStatusCard
                label="Tournament completion"
                metric={bundle.tournaments.data.completionRate}
                helper={
                  bundle.tournaments.data.completionRate.numerator !== null &&
                  bundle.tournaments.data.completionRate.denominator !== null
                    ? `${formatNumber(bundle.tournaments.data.completionRate.numerator)}/${formatNumber(bundle.tournaments.data.completionRate.denominator)} runs`
                    : 'No created tournaments in range'
                }
                format="percent"
              />
            </div>
          </article>

          <InlineSummaryList
            title="Dropout by round"
            subtitle="Where tournament exits are clustering based on recorded losers."
            items={bundle.tournaments.data.dropoutByRound.buckets.map((bucket) => ({
              key: bucket.label,
              label: bucket.label,
              value: formatNumber(bucket.count),
              hint:
                bucket.count === 1
                  ? '1 recorded exit'
                  : `${formatNumber(bucket.count)} recorded exits`,
            }))}
          />
        </div>

        <AnalyticsTableCard
          title="Recent tournaments"
          subtitle="Recent runs with entrant counts and bracket completion health."
          availability={bundle.tournaments.data.recentTournaments.availability}
          columns={recentTournamentColumns}
          rows={bundle.tournaments.data.recentTournaments.rows}
          defaultSortKey="finalizedAt"
        />
      </>
    )
  } else if (activeSectionId === 'progression') {
    sectionBody = (
      <>
        <section className="analytics-kpi-grid" aria-label="Progression KPIs">
          <AnalyticsStatCard
            label="Rated players"
            metric={ratedPlayersMetric ?? bundle.summary.data.dau}
            helper="Players represented in the current Elo distribution."
          />
          <AnalyticsStatCard
            label="Ranked players"
            metric={rankedPlayersMetric ?? bundle.summary.data.dau}
            helper="Players represented in the current rank distribution."
          />
          <AnalyticsStatCard
            label="XP issued"
            metric={xpIssuedMetric ?? bundle.summary.data.matchesPlayed}
            helper="Total XP awarded during the selected range."
          />
          <AnalyticsStatCard
            label="Median rating delta"
            metric={medianRatingDeltaMetric ?? bundle.summary.data.matchesPlayed}
            helper="Latest median absolute Elo movement."
            format="elo"
          />
          <AnalyticsStatCard
            label="Recent rank-ups"
            metric={recentRankUpsMetric ?? bundle.summary.data.matchesPlayed}
            helper="Count of recent rank promotions backed by XP award events."
          />
        </section>

        <div className="analytics-grid analytics-grid--2col">
          <AnalyticsChartCard
            title="XP awarded over time"
            subtitle="Raw XP issuance by day so you can see whether progression rewards are firing."
            availability={bundle.progression.data.xpAwardedOverTime.availability}
          >
            <AnalyticsLineChart
              labels={bundle.progression.data.xpAwardedOverTime.points.map((point) =>
                formatDateLabel(point.date),
              )}
              series={[
                {
                  key: 'xpAwarded',
                  label: 'XP awarded',
                  color: CHART_COLORS.rose,
                  values: bundle.progression.data.xpAwardedOverTime.points.map(
                    (point) => point.value,
                  ),
                },
              ]}
            />
          </AnalyticsChartCard>

          <AnalyticsChartCard
            title="Rank distribution"
            subtitle="Live progression spread by current rank title."
            availability={bundle.progression.data.rankDistribution.availability}
          >
            <AnalyticsBarChart
              labels={bundle.progression.data.rankDistribution.buckets.map(
                (bucket) => bucket.label,
              )}
              series={[
                {
                  key: 'ranks',
                  label: 'Players',
                  color: CHART_COLORS.teal,
                  values: bundle.progression.data.rankDistribution.buckets.map(
                    (bucket) => bucket.count,
                  ),
                },
              ]}
            />
          </AnalyticsChartCard>

          <article className="analytics-card analytics-card--stats">
            <header className="analytics-card__header">
              <div className="analytics-card__copy">
                <strong>Rating movement</strong>
                <p>Current movement signal and explicit tracking limits for early progression analysis.</p>
              </div>
            </header>

            <div className="analytics-mini-stats">
              <RealtimeStatusCard
                label="Median delta"
                metric={medianRatingDeltaMetric ?? bundle.summary.data.matchesPlayed}
                helper="Latest non-null median absolute Elo delta."
                format="elo"
              />
            </div>

            <div className="analytics-inline-empty">
              <strong>Challenge bottlenecks</strong>
              <p>Challenge completion bottleneck tracking is not yet exposed by the current analytics RPCs.</p>
            </div>
          </article>

          <InlineSummaryList
            title="Elo distribution"
            subtitle="Current leaderboard spread by Elo band."
            items={bundle.progression.data.eloDistribution.buckets.map((bucket) => ({
              key: bucket.key,
              label: bucket.label,
              value: formatNumber(bucket.count),
              hint:
                bucket.count === 1
                  ? '1 player in band'
                  : `${formatNumber(bucket.count)} players in band`,
            }))}
          />
        </div>

        <AnalyticsTableCard
          title="Recent rank-ups"
          subtitle="Recent real rank promotions backed by XP award events."
          availability={bundle.progression.data.recentRankUps.availability}
          columns={recentRankUpColumns}
          rows={bundle.progression.data.recentRankUps.rows}
          defaultSortKey="occurredAt"
        />
      </>
    )
  }

  return (
    <AnalyticsPageShell
      title={activeSection.label}
      description={activeSection.description}
      generatedAt={generatedAt}
      rangeLabel={rangeLabel}
      focusLabel={focusLabel}
      notices={notes}
      actions={headerActions}
      subnav={
        <TabNav
          label="Analytics views"
          items={analyticsSectionNavItems.map((item) => ({
            key: item.id,
            label: item.label,
            to: item.to,
          }))}
        />
      }
      filters={
        <AnalyticsFilters
          filters={filters}
          tournamentOptions={tournamentOptions}
          gameModeOptions={gameModeOptions}
          isLoading={isLoading}
          onApply={setFilters}
        />
      }
    >
      {error ? <div className="alert alert--error">{error}</div> : null}
      {activeSectionId === 'realtime' && realtimeError ? (
        <div className="alert alert--warning">{realtimeError}</div>
      ) : null}
      {sectionBody}
    </AnalyticsPageShell>
  )
}

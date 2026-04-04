import { useEffect, useMemo, useState } from 'react'
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
import {
  AnalyticsBarChart,
  AnalyticsFunnelChart,
  AnalyticsLineChart,
  AnalyticsRankedSegments,
} from '../components/analytics/AnalyticsCharts'
import { AnalyticsChartCard } from '../components/analytics/AnalyticsChartCard'
import { AnalyticsFilters } from '../components/analytics/AnalyticsFilters'
import { AnalyticsPageShell } from '../components/analytics/AnalyticsPageShell'
import { AnalyticsSection } from '../components/analytics/AnalyticsSection'
import { AnalyticsStatCard } from '../components/analytics/AnalyticsStatCard'
import { AnalyticsTableCard, type AnalyticsTableColumn } from '../components/analytics/AnalyticsTableCard'
import { AnalyticsUnavailableState } from '../components/analytics/AnalyticsUnavailableState'
import { RealtimeStatusCard } from '../components/analytics/RealtimeStatusCard'
import env from '../config/env'
import type {
  AnalyticsDashboardBundle,
  AnalyticsQueryFilters,
  AnalyticsRealtimeData,
  AnalyticsResponse,
  AnalyticsSectionId,
  AnalyticsTableRow,
} from '../types/analytics'

const SECTION_NAV: Array<{ id: AnalyticsSectionId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'players', label: 'Players' },
  { id: 'gameplay', label: 'Gameplay' },
  { id: 'tournaments', label: 'Tournaments' },
  { id: 'progression', label: 'Progression' },
  { id: 'realtime', label: 'Realtime / Ops' },
]

function getMetricNumber(row: AnalyticsTableRow, key: string) {
  const value = row.metrics[key]
  return typeof value === 'number' ? value : null
}

function getMetricString(row: AnalyticsTableRow, key: string) {
  const value = row.metrics[key]
  return typeof value === 'string' ? value : null
}

function collectBundleNotes(bundle: AnalyticsDashboardBundle | null, realtime: AnalyticsResponse<AnalyticsRealtimeData> | null) {
  const notes = new Set<string>()

  if (env.useMockData) {
    notes.add('Mock mode may be enabled elsewhere in ur-internals, but analytics only requests live backend data.')
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

  return Array.from(notes)
}

function buildGameModeOptions(bundle: AnalyticsDashboardBundle | null, tournamentOptions: Array<{ gameMode: string | null }>) {
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
    const mode = row.secondaryLabel
    if (mode) {
      options.add(mode)
    }
  })

  return Array.from(options).sort((left, right) => left.localeCompare(right))
}

function buildGeneratedAt(bundle: AnalyticsDashboardBundle | null, realtime: AnalyticsResponse<AnalyticsRealtimeData> | null) {
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

export function AnalyticsPage() {
  const { sessionToken } = useSession()
  const [filters, setFilters] = useState<AnalyticsQueryFilters>(() => createDefaultAnalyticsFilters())
  const [bundle, setBundle] = useState<AnalyticsDashboardBundle | null>(null)
  const [realtime, setRealtime] = useState<AnalyticsResponse<AnalyticsRealtimeData> | null>(null)
  const [tournamentOptions, setTournamentOptions] = useState<Array<{ id: string; label: string; gameMode: string | null }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRealtimeLoading, setIsRealtimeLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realtimeError, setRealtimeError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [realtimeRefreshTick, setRealtimeRefreshTick] = useState(0)
  const [autoRefreshRealtime, setAutoRefreshRealtime] = useState(true)

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
          loadError instanceof Error ? loadError.message : 'Unable to load analytics dashboard.'
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
          loadError instanceof Error ? loadError.message : 'Unable to load realtime analytics.'
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
  const gameModeOptions = useMemo(
    () => buildGameModeOptions(bundle, tournamentOptions),
    [bundle, tournamentOptions],
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
          <span className="muted">{getMetricString(row, 'loser') ?? 'Opponent unavailable'}</span>
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

  return (
    <AnalyticsPageShell
      generatedAt={generatedAt}
      notices={notes}
      actions={
        <ActionToolbar>
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
      {realtimeError ? <div className="alert alert--warning">{realtimeError}</div> : null}

      <nav className="analytics-nav" aria-label="Analytics sections">
        {SECTION_NAV.map((item) => (
          <a key={item.id} className="analytics-nav__link" href={`#analytics-${item.id}`}>
            {item.label}
          </a>
        ))}
      </nav>

      <section className="analytics-kpi-grid" aria-label="Analytics summary metrics">
        {bundle ? (
          <>
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
              helper="Completed or terminated matches ending in this range."
            />
            <AnalyticsStatCard
              label="Completion rate"
              metric={bundle.summary.data.completionRate}
              helper="Started matches that reached a proper finish."
              format="percent"
            />
            <AnalyticsStatCard
              label="Median match duration"
              metric={bundle.summary.data.medianMatchDurationSeconds}
              helper="Median duration of completed matches."
              format="duration"
            />
            <AnalyticsStatCard
              label="Tournaments completed"
              metric={bundle.summary.data.tournamentsCompleted}
              helper="Tournament runs finalized in the selected range."
            />
            <AnalyticsStatCard
              label="Players online"
              metric={bundle.summary.data.currentOnlinePlayers}
              helper="Current live presence snapshot from the Nakama runtime."
            />
            <AnalyticsStatCard
              label="Disconnect rate"
              metric={bundle.summary.data.disconnectRate}
              helper="Disconnect or inactivity forfeits among started matches."
              format="percent"
            />
          </>
        ) : (
          <div className="empty-state">
            {isLoading ? 'Loading analytics summary...' : 'Analytics summary is unavailable.'}
          </div>
        )}
      </section>

      {bundle ? (
        <>
          <AnalyticsSection
            id="analytics-overview"
            eyebrow="Overview"
            title="Overview"
            subtitle="Small-sample trends that answer whether the game is alive, returning usage is forming, and tournaments are moving."
          >
            <div className="analytics-grid analytics-grid--2col">
              <AnalyticsChartCard
                title="Daily active users"
                subtitle="Raw daily actives, shown as a daily line rather than a smoothed vanity curve."
                availability={bundle.overview.data.dauTrend.availability}
              >
                <AnalyticsLineChart
                  labels={bundle.overview.data.dauTrend.points.map((point) => formatDateLabel(point.date))}
                  series={[
                    {
                      key: 'dau',
                      label: 'DAU',
                      color: '#2b6bff',
                      values: bundle.overview.data.dauTrend.points.map((point) => point.value),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Weekly active users"
                subtitle="Trailing seven-day unique players. Useful once DAU is still small but repeat use matters."
                availability={bundle.overview.data.wauTrend.availability}
              >
                <AnalyticsLineChart
                  labels={bundle.overview.data.wauTrend.points.map((point) => formatDateLabel(point.date))}
                  series={[
                    {
                      key: 'wau',
                      label: 'WAU',
                      color: '#6b52e5',
                      values: bundle.overview.data.wauTrend.points.map((point) => point.value),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Matches per day"
                subtitle="Daily match throughput in the current filter window."
                availability={bundle.overview.data.matchesPerDay.availability}
              >
                <AnalyticsLineChart
                  labels={bundle.overview.data.matchesPerDay.points.map((point) => formatDateLabel(point.date))}
                  series={[
                    {
                      key: 'matches',
                      label: 'Matches',
                      color: '#1f9b62',
                      values: bundle.overview.data.matchesPerDay.points.map((point) => point.value),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Completion rate trend"
                subtitle="Completion percentage with its true daily denominator, which matters a lot at low scale."
                availability={bundle.overview.data.completionRateTrend.availability}
              >
                <AnalyticsLineChart
                  labels={bundle.overview.data.completionRateTrend.points.map((point) => formatDateLabel(point.date))}
                  series={[
                    {
                      key: 'completionRate',
                      label: 'Completion rate',
                      color: '#c48718',
                      values: bundle.overview.data.completionRateTrend.points.map((point) => point.value),
                    },
                  ]}
                  valueFormatter={(value) => formatPercent(value)}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="New vs returning players"
                subtitle="A straight count split so you can judge whether growth is acquisition, retention, or both."
                availability={bundle.overview.data.newVsReturningPlayers.availability}
              >
                <AnalyticsBarChart
                  labels={bundle.overview.data.newVsReturningPlayers.points.map((point) => formatDateLabel(point.date))}
                  series={[
                    {
                      key: 'new',
                      label: 'New',
                      color: '#2b6bff',
                      values: bundle.overview.data.newVsReturningPlayers.points.map((point) => point.primary),
                    },
                    {
                      key: 'returning',
                      label: 'Returning',
                      color: '#6b52e5',
                      values: bundle.overview.data.newVsReturningPlayers.points.map((point) => point.secondary),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <article className="analytics-card analytics-card--stats">
                <header className="analytics-card__header">
                  <div className="analytics-card__copy">
                    <strong>Range totals</strong>
                    <p>Compact totals that help interpret the chart context without hiding the raw count scale.</p>
                  </div>
                </header>

                <div className="analytics-mini-stats">
                  <RealtimeStatusCard
                    label="Active players in range"
                    metric={bundle.overview.data.totalPlayers}
                    helper="Unique players with recorded activity in the selected range."
                  />
                  <RealtimeStatusCard
                    label="Tournaments created"
                    metric={bundle.overview.data.tournamentsCreated}
                    helper="Runs created during the selected window."
                  />
                  <RealtimeStatusCard
                    label="Tournaments completed"
                    metric={bundle.overview.data.tournamentsCompleted}
                    helper="Runs finalized during the selected window."
                  />
                </div>
              </article>
            </div>
          </AnalyticsSection>

          <AnalyticsSection
            id="analytics-players"
            eyebrow="Players"
            title="Players"
            subtitle="Retention-adjacent signals, engagement buckets, and the specific players carrying the live game today."
          >
            <div className="analytics-grid analytics-grid--2col">
              <AnalyticsChartCard
                title="New players over time"
                subtitle="First-seen players by day using real observed activity, not signup assumptions."
                availability={bundle.players.data.newPlayersOverTime.availability}
              >
                <AnalyticsLineChart
                  labels={bundle.players.data.newPlayersOverTime.points.map((point) => formatDateLabel(point.date))}
                  series={[
                    {
                      key: 'newPlayers',
                      label: 'New players',
                      color: '#2b6bff',
                      values: bundle.players.data.newPlayersOverTime.points.map((point) => point.value),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Returning players over time"
                subtitle="Players active on a day after they were first seen. This is the early repeat-use signal."
                availability={bundle.players.data.returningPlayersOverTime.availability}
              >
                <AnalyticsLineChart
                  labels={bundle.players.data.returningPlayersOverTime.points.map((point) => formatDateLabel(point.date))}
                  series={[
                    {
                      key: 'returningPlayers',
                      label: 'Returning players',
                      color: '#6b52e5',
                      values: bundle.players.data.returningPlayersOverTime.points.map((point) => point.value),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Activity buckets"
                subtitle="A low-scale engagement split: one active day, a few active days, and highly engaged returners."
                availability={bundle.players.data.activityBuckets.availability}
              >
                <AnalyticsBarChart
                  labels={bundle.players.data.activityBuckets.buckets.map((bucket) => bucket.label)}
                  series={[
                    {
                      key: 'activityBuckets',
                      label: 'Players',
                      color: '#1f9b62',
                      values: bundle.players.data.activityBuckets.buckets.map((bucket) => bucket.count),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <article className="analytics-card analytics-card--stats">
                <header className="analytics-card__header">
                  <div className="analytics-card__copy">
                    <strong>Retention snapshot</strong>
                    <p>D1, D7, and D30 only render when the cohort is real and mature enough to say something honest.</p>
                  </div>
                </header>

                {bundle.players.data.retention.availability.hasData ? (
                  <div className="analytics-mini-stats">
                    <RealtimeStatusCard
                      label="D1 retention"
                      metric={bundle.players.data.retention.d1}
                      helper="Returned exactly one day after first observed activity."
                      format="percent"
                    />
                    <RealtimeStatusCard
                      label="D7 retention"
                      metric={bundle.players.data.retention.d7}
                      helper="Returned exactly seven days later."
                      format="percent"
                    />
                    <RealtimeStatusCard
                      label="D30 retention"
                      metric={bundle.players.data.retention.d30}
                      helper="Returned exactly thirty days later."
                      format="percent"
                    />
                  </div>
                ) : (
                  <AnalyticsUnavailableState availability={bundle.players.data.retention.availability} />
                )}
              </article>
            </div>

            <AnalyticsTableCard
              title="Most engaged players"
              subtitle="Sorted from real match activity, with win rate, Elo, and tournament participation in view."
              availability={bundle.players.data.topPlayers.availability}
              columns={topPlayerColumns}
              rows={bundle.players.data.topPlayers.rows}
              defaultSortKey="matchesPlayed"
            />
          </AnalyticsSection>

          <AnalyticsSection
            id="analytics-gameplay"
            eyebrow="Gameplay"
            title="Gameplay"
            subtitle="Core loop health: are matches starting, finishing, disconnecting, and showing signs of fair play?"
          >
            <div className="analytics-grid analytics-grid--2col">
              <AnalyticsChartCard
                title="Match endings per day"
                subtitle="The simplest core loop usage chart: how many matches actually reached an end state each day."
                availability={bundle.gameplay.data.matchesPerDay.availability}
              >
                <AnalyticsLineChart
                  labels={bundle.gameplay.data.matchesPerDay.points.map((point) => formatDateLabel(point.date))}
                  series={[
                    {
                      key: 'matchesPerDay',
                      label: 'Matches',
                      color: '#2b6bff',
                      values: bundle.gameplay.data.matchesPerDay.points.map((point) => point.value),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Started vs completed"
                subtitle="A raw daily split showing where volume is stalling before completion."
                availability={bundle.gameplay.data.startedVsCompleted.availability}
              >
                <AnalyticsBarChart
                  labels={bundle.gameplay.data.startedVsCompleted.points.map((point) => formatDateLabel(point.date))}
                  series={[
                    {
                      key: 'started',
                      label: 'Started',
                      color: '#2b6bff',
                      values: bundle.gameplay.data.startedVsCompleted.points.map((point) => point.started),
                    },
                    {
                      key: 'completed',
                      label: 'Completed',
                      color: '#1f9b62',
                      values: bundle.gameplay.data.startedVsCompleted.points.map((point) => point.completed),
                    },
                    {
                      key: 'abandoned',
                      label: 'Abandoned',
                      color: '#d54d6c',
                      values: bundle.gameplay.data.startedVsCompleted.points.map((point) => point.abandoned),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Completion funnel"
                subtitle="Early-stage funnel for started matches: completed vs disconnect and inactivity exits."
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
                    {
                      key: 'abandoned',
                      label: 'No completed result',
                      value: bundle.gameplay.data.completionFunnel.abandoned,
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Match duration distribution"
                subtitle="Median matters more than flashy averages here, but the raw bucket spread helps spot weird outliers."
                availability={bundle.gameplay.data.durationDistribution.availability}
              >
                <AnalyticsBarChart
                  labels={bundle.gameplay.data.durationDistribution.buckets.map((bucket) => bucket.label)}
                  series={[
                    {
                      key: 'durations',
                      label: 'Matches',
                      color: '#6b52e5',
                      values: bundle.gameplay.data.durationDistribution.buckets.map((bucket) => bucket.count),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Light-side win rate by mode"
                subtitle="A fairness check using actual completed matches and the recorded light-side result in each mode."
                availability={bundle.gameplay.data.winRateByMode.availability}
              >
                <AnalyticsRankedSegments segments={bundle.gameplay.data.winRateByMode.segments} />
              </AnalyticsChartCard>

              <article className="analytics-card analytics-card--stats">
                <header className="analytics-card__header">
                  <div className="analytics-card__copy">
                    <strong>Reliability metrics</strong>
                    <p>Operational friction signals surfaced next to explicit tracking gaps.</p>
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

                <div className="analytics-inline-empty">
                  <strong>Turn-order fairness</strong>
                  <p>{bundle.gameplay.data.winRateByTurnOrder.availability.notes[0] ?? 'Tracking not implemented yet.'}</p>
                </div>
              </article>
            </div>

            <AnalyticsTableCard
              title="Recent match endings"
              subtitle="Recent completions and early terminations with duration and move counts."
              availability={bundle.gameplay.data.recentMatches.availability}
              columns={recentMatchesColumns}
              rows={bundle.gameplay.data.recentMatches.rows}
              defaultSortKey="endedAt"
            />
          </AnalyticsSection>

          <AnalyticsSection
            id="analytics-tournaments"
            eyebrow="Tournaments"
            title="Tournaments"
            subtitle="Operational health for the tournament system: creation, participation, completion, and where entrants are dropping out."
          >
            <div className="analytics-grid analytics-grid--2col">
              <AnalyticsChartCard
                title="Tournaments created"
                subtitle="Tournament creation cadence over the selected range."
                availability={bundle.tournaments.data.createdOverTime.availability}
              >
                <AnalyticsLineChart
                  labels={bundle.tournaments.data.createdOverTime.points.map((point) => formatDateLabel(point.date))}
                  series={[
                    {
                      key: 'created',
                      label: 'Created',
                      color: '#2b6bff',
                      values: bundle.tournaments.data.createdOverTime.points.map((point) => point.value),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Participation counts"
                subtitle="How large tournament fields are right now, which matters more than aggregate totals at this scale."
                availability={bundle.tournaments.data.participationCounts.availability}
              >
                <AnalyticsBarChart
                  labels={bundle.tournaments.data.participationCounts.buckets.map((bucket) => bucket.label)}
                  series={[
                    {
                      key: 'participation',
                      label: 'Tournaments',
                      color: '#1f9b62',
                      values: bundle.tournaments.data.participationCounts.buckets.map((bucket) => bucket.count),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Dropout by round"
                subtitle="Where tournament exits are clustering based on recorded losers per round."
                availability={bundle.tournaments.data.dropoutByRound.availability}
              >
                <AnalyticsBarChart
                  labels={bundle.tournaments.data.dropoutByRound.buckets.map((bucket) => bucket.label)}
                  series={[
                    {
                      key: 'dropout',
                      label: 'Dropouts',
                      color: '#d54d6c',
                      values: bundle.tournaments.data.dropoutByRound.buckets.map((bucket) => bucket.count),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Tournament duration distribution"
                subtitle="How long finalized runs actually take from opening to finalization."
                availability={bundle.tournaments.data.durationDistribution.availability}
              >
                <AnalyticsBarChart
                  labels={bundle.tournaments.data.durationDistribution.buckets.map((bucket) => bucket.label)}
                  series={[
                    {
                      key: 'duration',
                      label: 'Tournaments',
                      color: '#6b52e5',
                      values: bundle.tournaments.data.durationDistribution.buckets.map((bucket) => bucket.count),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <article className="analytics-card analytics-card--stats">
                <header className="analytics-card__header">
                  <div className="analytics-card__copy">
                    <strong>Completion snapshot</strong>
                    <p>Completion percentage is shown with the current denominator so small samples stay interpretable.</p>
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
            </div>

            <AnalyticsTableCard
              title="Recent tournaments"
              subtitle="Recent runs with entrant counts and bracket completion health."
              availability={bundle.tournaments.data.recentTournaments.availability}
              columns={recentTournamentColumns}
              rows={bundle.tournaments.data.recentTournaments.rows}
              defaultSortKey="finalizedAt"
            />
          </AnalyticsSection>

          <AnalyticsSection
            id="analytics-progression"
            eyebrow="Progression"
            title="Progression"
            subtitle="Rating and rank movement only where the underlying Elo and XP systems are live enough to tell the truth."
          >
            <div className="analytics-grid analytics-grid--2col">
              <AnalyticsChartCard
                title="Elo distribution"
                subtitle="Current leaderboard distribution, useful for checking whether the rating pool is beginning to spread."
                availability={bundle.progression.data.eloDistribution.availability}
              >
                <AnalyticsBarChart
                  labels={bundle.progression.data.eloDistribution.buckets.map((bucket) => bucket.label)}
                  series={[
                    {
                      key: 'elo',
                      label: 'Players',
                      color: '#2b6bff',
                      values: bundle.progression.data.eloDistribution.buckets.map((bucket) => bucket.count),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Rank distribution"
                subtitle="Live progression profile spread by rank title."
                availability={bundle.progression.data.rankDistribution.availability}
              >
                <AnalyticsBarChart
                  labels={bundle.progression.data.rankDistribution.buckets.map((bucket) => bucket.label)}
                  series={[
                    {
                      key: 'ranks',
                      label: 'Players',
                      color: '#1f9b62',
                      values: bundle.progression.data.rankDistribution.buckets.map((bucket) => bucket.count),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Rating movement"
                subtitle="Median absolute Elo delta by day, paired with the actual count of rated matches."
                availability={bundle.progression.data.ratingMovement.availability}
              >
                <AnalyticsLineChart
                  labels={bundle.progression.data.ratingMovement.points.map((point) => formatDateLabel(point.date))}
                  series={[
                    {
                      key: 'medianDelta',
                      label: 'Median delta',
                      color: '#6b52e5',
                      values: bundle.progression.data.ratingMovement.points.map((point) => point.medianAbsoluteDelta),
                    },
                    {
                      key: 'ratedMatches',
                      label: 'Rated matches',
                      color: '#c48718',
                      values: bundle.progression.data.ratingMovement.points.map((point) => point.ratedMatches),
                    },
                  ]}
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="XP awarded over time"
                subtitle="Raw XP issuance by day so you can see whether progression rewards are actually firing."
                availability={bundle.progression.data.xpAwardedOverTime.availability}
              >
                <AnalyticsLineChart
                  labels={bundle.progression.data.xpAwardedOverTime.points.map((point) => formatDateLabel(point.date))}
                  series={[
                    {
                      key: 'xpAwarded',
                      label: 'XP awarded',
                      color: '#d54d6c',
                      values: bundle.progression.data.xpAwardedOverTime.points.map((point) => point.value),
                    },
                  ]}
                />
              </AnalyticsChartCard>
            </div>

            <AnalyticsTableCard
              title="Recent rank-ups"
              subtitle="Recent real rank promotions backed by XP award events."
              availability={bundle.progression.data.recentRankUps.availability}
              columns={recentRankUpColumns}
              rows={bundle.progression.data.recentRankUps.rows}
              defaultSortKey="occurredAt"
            />
          </AnalyticsSection>

          <AnalyticsSection
            id="analytics-realtime"
            eyebrow="Realtime / Ops"
            title="Realtime / Ops"
            subtitle="Current live status, recent operational events, and the places where telemetry is still intentionally missing."
            actions={
              <ActionToolbar>
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
                  {isRealtimeLoading ? 'Refreshing...' : 'Refresh realtime'}
                </button>
              </ActionToolbar>
            }
          >
            {realtime ? (
              <>
                <div className="analytics-mini-stats analytics-mini-stats--4up">
                  <RealtimeStatusCard
                    label="Online players"
                    metric={realtime.data.onlinePlayers}
                    helper="Current presence heartbeat count."
                  />
                  <RealtimeStatusCard
                    label="Active matches"
                    metric={realtime.data.activeMatches}
                    helper="Matches currently tracked as live."
                  />
                  <RealtimeStatusCard
                    label="Active tournaments"
                    metric={realtime.data.activeTournaments}
                    helper="Runs still open or not yet finalized."
                  />
                  <RealtimeStatusCard
                    label="Queue size"
                    metric={realtime.data.queueSize}
                    helper={realtime.data.queueSize.availability.notes[0] ?? 'Not available'}
                  />
                </div>

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

                  <article className="analytics-card">
                    <header className="analytics-card__header">
                      <div className="analytics-card__copy">
                        <strong>Freshness</strong>
                        <p>Realtime signal recency so you can judge whether the ops panel is still trustworthy.</p>
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

                    <div className="analytics-inline-empty">
                      <strong>Last event timestamp</strong>
                      <p>{formatDateTime(realtime.data.freshness.lastEventAt)}</p>
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
              <div className="empty-state">
                {isRealtimeLoading ? 'Loading realtime analytics...' : 'Realtime analytics are unavailable.'}
              </div>
            )}
          </AnalyticsSection>
        </>
      ) : null}
    </AnalyticsPageShell>
  )
}

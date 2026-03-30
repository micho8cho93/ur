import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAuditLog } from '../api/auditLog'
import { getTournamentLiveOverview } from '../api/liveStatus'
import { useSession } from '../auth/useSession'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { buildTournamentLiveOverviewKpis } from '../liveOps'
import type { AuditLogEntry } from '../types/audit'
import type {
  TournamentActiveMatchesByRound,
  TournamentLiveSummary,
  TournamentTimelineBucket,
} from '../types/tournament'

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

function renderAlertStrip(summary: TournamentLiveSummary) {
  if (summary.alerts.length === 0) {
    return <span className="alert-chip alert-chip--info">Quiet</span>
  }

  return (
    <>
      {summary.alerts.slice(0, 3).map((alert) => (
        <span
          key={`${summary.runId}-${alert.code}`}
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

export function OverviewPage() {
  const { sessionToken } = useSession()
  const [summaries, setSummaries] = useState<TournamentLiveSummary[]>([])
  const [activeMatchesByRound, setActiveMatchesByRound] = useState<TournamentActiveMatchesByRound[]>([])
  const [completionBuckets, setCompletionBuckets] = useState<TournamentTimelineBucket[]>([])
  const [auditTimeline, setAuditTimeline] = useState<TournamentTimelineBucket[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadOverview() {
      setIsLoading(true)
      setError(null)

      try {
        const [overview, nextAuditLog] = await Promise.all([
          getTournamentLiveOverview(12),
          listAuditLog(8),
        ])

        if (!active) {
          return
        }

        setSummaries(overview.summaries)
        setActiveMatchesByRound(overview.activeMatchesByRound)
        setCompletionBuckets(overview.completionsOverTime)
        setAuditTimeline(overview.auditActivityTimeline)
        setAuditLog(nextAuditLog)
      } catch (loadError) {
        if (!active) {
          return
        }

        const message =
          loadError instanceof Error ? loadError.message : 'Unable to load overview data.'
        setError(message)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadOverview()
    const intervalId = window.setInterval(() => {
      void loadOverview()
    }, 15000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [sessionToken])

  const kpis = buildTournamentLiveOverviewKpis(summaries)

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Tournament ops dashboard"
        description="Cross-tournament operational view with live bracket pressure, queue health, finalize readiness, and audit activity."
        actions={
          <Link className="button button--primary" to="/tournaments/new">
            Create tournament
          </Link>
        }
      />

      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="stats-grid" aria-label="Overview metrics">
        <StatCard
          label="Open runs"
          value={isLoading ? '...' : String(kpis.openRuns)}
          helper="Currently accepting or scoring live play."
          tone="accent"
        />
        <StatCard
          label="Starting soon"
          value={isLoading ? '...' : String(kpis.startingSoon)}
          helper="Scheduled within the next hour."
          tone="default"
        />
        <StatCard
          label="Active matches"
          value={isLoading ? '...' : String(kpis.activeMatches)}
          helper="Live tournament games in progress."
          tone="success"
        />
        <StatCard
          label="Players waiting next round"
          value={isLoading ? '...' : String(kpis.waitingPlayers)}
          helper="Advanced players waiting for bracket resolution."
        />
        <StatCard
          label="Action needed"
          value={isLoading ? '...' : String(kpis.actionNeeded)}
          helper="Runs with warnings or critical alerts."
          tone="warning"
        />
        <StatCard
          label="Finalize ready"
          value={isLoading ? '...' : String(kpis.finalizeReady)}
          helper="Completed brackets that can be archived now."
          tone="success"
        />
      </section>

      <section className="panel stack">
        <div className="panel__header">
          <div>
            <h3 className="panel__title">Urgent runs</h3>
            <span className="panel__subtitle">Sorted by stale states, ready matches, and live bracket pressure.</span>
          </div>
          <Link to="/tournaments" className="button">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading live tournament status...</div>
        ) : summaries.length === 0 ? (
          <div className="empty-state">No active or recent tournament runs were returned.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Lifecycle</th>
                  <th>Entrants</th>
                  <th>Current round</th>
                  <th>Active</th>
                  <th>Ready</th>
                  <th>Waiting</th>
                  <th>Last activity</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary) => (
                  <tr key={summary.runId}>
                    <td>
                      <div className="stack stack--compact">
                        <strong>{summary.title}</strong>
                        <span className="muted mono">{summary.runId}</span>
                        <div className="alert-chip-row">{renderAlertStrip(summary)}</div>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={summary.lifecycle} />
                    </td>
                    <td>
                      {summary.entrants}/{summary.capacity}
                    </td>
                    <td>{summary.currentRound ? `Round ${summary.currentRound}` : 'Not seeded yet'}</td>
                    <td>{summary.activeMatches}</td>
                    <td>{summary.readyMatches}</td>
                    <td>{summary.waitingPlayers}</td>
                    <td>
                      <div className="stack stack--compact">
                        <strong>{formatTimeAgo(summary.lastActivityAt ?? summary.updatedAt)}</strong>
                        <span className="muted">{formatDateTime(summary.lastActivityAt ?? summary.updatedAt)}</span>
                      </div>
                    </td>
                    <td>
                      <Link to={`/tournaments/${summary.runId}`}>Control room</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Bracket progress</h3>
              <span className="panel__subtitle">How far each visible run has advanced through its bracket.</span>
            </div>
          </div>

          {summaries.length === 0 ? (
            <div className="empty-state">Bracket progress appears once runs are available.</div>
          ) : (
            renderProgressRows(
              summaries.map((summary) => ({
                key: summary.runId,
                label: summary.title,
                valueLabel:
                  summary.totalMatches > 0
                    ? `${summary.completedMatches}/${summary.totalMatches}`
                    : 'Pending',
                progress:
                  summary.totalMatches > 0
                    ? (summary.completedMatches / summary.totalMatches) * 100
                    : 0,
                hint:
                  summary.totalMatches > 0
                    ? `${summary.totalMatches - summary.completedMatches} matches still unresolved`
                    : 'Bracket not seeded yet',
              })),
            )
          )}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Active matches by round</h3>
              <span className="panel__subtitle">Cross-run heat map of where live play is currently concentrated.</span>
            </div>
          </div>

          {activeMatchesByRound.length === 0 ? (
            <div className="empty-state">No rounds currently have active matches.</div>
          ) : (
            renderCountRows(
              activeMatchesByRound.map((row) => ({
                key: String(row.round),
                label: `Round ${row.round}`,
                value: row.count,
                hint: row.count === 1 ? '1 live match' : `${row.count} live matches`,
              })),
            )
          )}
        </article>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Registration fill vs capacity</h3>
              <span className="panel__subtitle">Current entrant pressure against configured bracket size.</span>
            </div>
          </div>

          {summaries.length === 0 ? (
            <div className="empty-state">No capacity data available yet.</div>
          ) : (
            renderProgressRows(
              summaries.map((summary) => ({
                key: summary.runId,
                label: summary.title,
                valueLabel: `${summary.entrants}/${summary.capacity}`,
                progress: summary.registrationFillPercent,
                hint: `${summary.registrationFillPercent}% full`,
              })),
            )
          )}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Completions over time</h3>
              <span className="panel__subtitle">Completed bracket entries across recent runs.</span>
            </div>
          </div>

          {renderTimelineChart(completionBuckets, 'No completed matches recorded in the current time window.')}
        </article>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Audit activity timeline</h3>
              <span className="panel__subtitle">Operator actions across the visible tournament set.</span>
            </div>
          </div>

          {renderTimelineChart(auditTimeline, 'No audit events recorded in the current time window.')}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Recent audit activity</h3>
              <span className="panel__subtitle">Most recent operator events from the admin audit trail.</span>
            </div>
            <Link to="/audit-log" className="button">
              Full log
            </Link>
          </div>

          {isLoading ? (
            <div className="empty-state">Loading activity...</div>
          ) : auditLog.length === 0 ? (
            <div className="empty-state">No audit entries returned yet.</div>
          ) : (
            <ul className="list">
              {auditLog.slice(0, 6).map((entry) => (
                <li key={entry.id} className="list__item">
                  <div className="list__meta">
                    <strong>{entry.action}</strong>
                    <span>{formatDateTime(entry.createdAt)}</span>
                  </div>
                  <span>
                    {entry.actor} on {entry.target}
                  </span>
                  <span className="muted">{entry.summary}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </>
  )
}

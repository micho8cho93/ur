import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import { listAuditLog } from '../api/auditLog'
import { listTournaments } from '../api/tournaments'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import type { AuditLogEntry } from '../types/audit'
import type { Tournament } from '../types/tournament'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function OverviewPage() {
  const { sessionToken } = useSession()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadOverview() {
      setIsLoading(true)
      setError(null)

      try {
        const [nextTournaments, nextAuditLog] = await Promise.all([
          listTournaments(12),
          listAuditLog(8),
        ])

        if (!active) {
          return
        }

        setTournaments(nextTournaments)
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

    return () => {
      active = false
    }
  }, [sessionToken])

  const openCount = tournaments.filter((item) => item.status === 'Open').length
  const draftCount = tournaments.filter((item) => item.status === 'Draft').length
  const finalizedCount = tournaments.filter((item) => item.status === 'Finalized').length
  const totalEntrants = tournaments.reduce((count, item) => count + item.entrants, 0)

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Admin RPC summary"
        description="Live tournament run stats and recent operator activity pulled directly from the Nakama admin RPC layer."
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
          value={isLoading ? '...' : String(openCount)}
          helper="Currently scoring matches into Nakama."
          tone="accent"
        />
        <StatCard
          label="Draft runs"
          value={isLoading ? '...' : String(draftCount)}
          helper="Configured but not opened yet."
        />
        <StatCard
          label="Tracked entrants"
          value={isLoading ? '...' : String(totalEntrants)}
          helper="Current tournament record count across visible runs."
        />
        <StatCard
          label="Finalized runs"
          value={isLoading ? '...' : String(finalizedCount)}
          helper="Closed tournaments with locked rankings."
          tone="success"
        />
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Tournament runs</h3>
              <span className="panel__subtitle">Latest admin-visible runs from Nakama.</span>
            </div>
            <Link to="/tournaments" className="button">
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className="empty-state">Loading tournaments...</div>
          ) : tournaments.length === 0 ? (
            <div className="empty-state">No tournament runs returned by the admin RPC.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Start</th>
                    <th>Entries</th>
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.slice(0, 5).map((tournament) => (
                    <tr key={tournament.id}>
                      <td>{tournament.name}</td>
                      <td>
                        <StatusBadge status={tournament.status} />
                      </td>
                      <td>{formatDateTime(tournament.startAt)}</td>
                      <td>
                        {tournament.entrants}/{tournament.maxEntrants}
                      </td>
                      <td>
                        <Link to={`/tournaments/${tournament.id}`}>Details</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Recent audit activity</h3>
              <span className="panel__subtitle">Aggregated from per-run audit RPCs.</span>
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
              {auditLog.slice(0, 5).map((entry) => (
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

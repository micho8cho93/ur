import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import { getTournamentAuditLog } from '../api/auditLog'
import {
  deleteTournament,
  getTournament,
  getTournamentStandings,
  openTournament,
} from '../api/tournaments'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { getTournamentStructureLabel } from '../tournamentStructure'
import type { AuditLogEntry } from '../types/audit'
import type { Tournament, TournamentEntry, TournamentStandings } from '../types/tournament'

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function describeEntry(entry: TournamentEntry) {
  const parts = [
    entry.result ? `Result: ${entry.result}` : null,
    entry.round ? `Round ${entry.round}` : null,
    entry.matchId ? `Match ${entry.matchId}` : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' · ') : 'No per-entry metadata yet.'
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
  const [standings, setStandings] = useState<TournamentStandings>(emptyStandings)
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpening, setIsOpening] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canDeleteTournaments = adminIdentity?.role === 'admin'

  useEffect(() => {
    let active = true

    async function loadDetail() {
      if (!tournamentId) {
        setError('Missing tournament id.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const nextTournament = await getTournament(tournamentId)

        if (!active) {
          return
        }

        if (!nextTournament) {
          setTournament(null)
          setStandings(emptyStandings)
          setAuditEntries([])
          return
        }

        const [nextStandings, nextAuditLog] = await Promise.all([
          nextTournament.status === 'Draft'
            ? Promise.resolve(emptyStandings)
            : getTournamentStandings(tournamentId, 100),
          getTournamentAuditLog(tournamentId, 50),
        ])

        if (!active) {
          return
        }

        setTournament(nextTournament)
        setStandings(nextStandings)
        setAuditEntries(nextAuditLog)
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

    void loadDetail()

    return () => {
      active = false
    }
  }, [sessionToken, tournamentId])

  async function handleOpenTournament() {
    if (!tournament) {
      return
    }

    setError(null)
    setIsOpening(true)

    try {
      const openedTournament = await openTournament(tournament.id)
      const [nextStandings, nextAuditLog] = await Promise.all([
        getTournamentStandings(openedTournament.id, 100),
        getTournamentAuditLog(openedTournament.id, 50),
      ])

      setTournament(openedTournament)
      setStandings(nextStandings)
      setAuditEntries(nextAuditLog)
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
          description="The requested run was not returned by the Nakama admin RPC."
          actions={
            <Link to="/tournaments" className="button">
              Back to tournaments
            </Link>
          }
        />
      </section>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="TournamentDetail"
        title={tournament.name}
        description="Run configuration, standings records, and audit trail for a single tournament run."
        actions={
          <div className="page-header__actions">
            {tournament.status === 'Draft' ? (
              <button
                className="button button--primary"
                type="button"
                disabled={isOpening || isDeleting}
                onClick={() => {
                  void handleOpenTournament()
                }}
              >
                {isOpening ? 'Opening...' : 'Open tournament'}
              </button>
            ) : null}
            {canDeleteTournaments ? (
              <button
                className="button button--danger"
                type="button"
                disabled={isDeleting || isOpening}
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
          <StatusBadge status={tournament.status} />
          <span className="button">{getTournamentStructureLabel(tournament.gameMode)}</span>
          <span className="button">{tournament.operator.toUpperCase()}</span>
        </div>
        <p className="detail-hero__summary">{tournament.description}</p>

        <div className="metric-grid">
          <div className="metric-card">
            <span className="meta-label">Start</span>
            <strong>{formatDateTime(tournament.startAt)}</strong>
          </div>
          <div className="metric-card">
            <span className="meta-label">Entries</span>
            <strong>
              {tournament.entrants}/{tournament.maxEntrants}
            </strong>
          </div>
          <div className="metric-card">
            <span className="meta-label">Counted matches per player</span>
            <strong>{tournament.maxNumScore}</strong>
          </div>
        </div>
      </section>

      <section className="split-grid">
        <article className="panel stack">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Configuration</h3>
              <span className="panel__subtitle">Normalized from the run record and Nakama tournament.</span>
            </div>
          </div>

          <div className="metric-grid">
            <div className="metric-card">
              <span className="meta-label">Run id</span>
              <strong className="mono">{tournament.id}</strong>
            </div>
            <div className="metric-card">
              <span className="meta-label">Tournament id</span>
              <strong className="mono">{tournament.tournamentId}</strong>
            </div>
            <div className="metric-card">
              <span className="meta-label">Created by</span>
              <strong>{tournament.createdBy}</strong>
            </div>
            <div className="metric-card">
              <span className="meta-label">Structure</span>
              <strong>{getTournamentStructureLabel(tournament.gameMode)}</strong>
            </div>
            <div className="metric-card">
              <span className="meta-label">Join required</span>
              <strong>{tournament.joinRequired ? 'Yes' : 'No'}</strong>
            </div>
            <div className="metric-card">
              <span className="meta-label">End time</span>
              <strong>{formatDateTime(tournament.endAt)}</strong>
            </div>
          </div>
        </article>

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
                    <th>Counted Matches</th>
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
      </section>

      <section className="split-grid">
        <article className="panel stack">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Entries</h3>
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
        </article>

        <article className="panel stack">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Audit trace</h3>
              <span className="panel__subtitle">Returned by the per-run audit RPC.</span>
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
    </>
  )
}

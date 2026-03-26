import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import { listTournaments } from '../api/tournaments'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import type { Tournament } from '../types/tournament'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function TournamentsPage() {
  const { sessionToken } = useSession()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadTournaments() {
      setIsLoading(true)
      setError(null)

      try {
        const nextTournaments = await listTournaments(50)

        if (!active) {
          return
        }

        setTournaments(nextTournaments)
      } catch (loadError) {
        if (!active) {
          return
        }

        const message =
          loadError instanceof Error ? loadError.message : 'Unable to load tournaments.'
        setError(message)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadTournaments()

    return () => {
      active = false
    }
  }, [sessionToken])

  return (
    <>
      <PageHeader
        eyebrow="Tournaments"
        title="Tournament runs"
        description="Live list of tournament runs returned by the Nakama admin list RPC, including lifecycle, capacity, and scoring settings."
        actions={
          <Link className="button button--primary" to="/tournaments/new">
            New tournament
          </Link>
        }
      />

      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3 className="panel__title">All runs</h3>
            <span className="panel__subtitle">Backed by `rpc_admin_list_tournaments`.</span>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading tournaments...</div>
        ) : tournaments.length === 0 ? (
          <div className="empty-state">No tournament runs returned for this admin session.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Mode</th>
                  <th>Start</th>
                  <th>Entries</th>
                  <th>Region</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((tournament) => (
                  <tr key={tournament.id}>
                    <td>
                      <div className="stack stack--compact">
                        <strong>{tournament.name}</strong>
                        <span className="muted mono">{tournament.id}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={tournament.status} />
                    </td>
                    <td>{tournament.gameMode}</td>
                    <td>{formatDateTime(tournament.startAt)}</td>
                    <td>
                      {tournament.entrants}/{tournament.maxEntrants}
                    </td>
                    <td>{tournament.region}</td>
                    <td>
                      <Link to={`/tournaments/${tournament.id}`}>Details</Link>
                    </td>
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

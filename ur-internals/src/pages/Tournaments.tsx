import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import { deleteTournament, listTournaments, openTournament } from '../api/tournaments'
import { ActionToolbar } from '../components/ActionToolbar'
import { MetaStrip, MetaStripItem } from '../components/MetaStrip'
import { PageHeader } from '../components/PageHeader'
import { SectionPanel } from '../components/SectionPanel'
import { StatusBadge } from '../components/StatusBadge'
import { appRoutes } from '../routes'
import { formatTournamentBotSummary } from '../tournamentBots'
import { getTournamentStructureLabel } from '../tournamentStructure'
import type { Tournament } from '../types/tournament'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function TournamentsPage() {
  const { adminIdentity, sessionToken } = useSession()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openingRunId, setOpeningRunId] = useState<string | null>(null)
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canDeleteTournaments = adminIdentity?.role === 'admin'
  const openRuns = tournaments.filter((tournament) => tournament.status === 'Open').length
  const draftRuns = tournaments.filter((tournament) => tournament.status === 'Draft').length
  const finalizedRuns = tournaments.filter((tournament) => tournament.status === 'Finalized').length
  const totalEntrants = tournaments.reduce((sum, tournament) => sum + tournament.entrants, 0)

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

  async function handleOpenTournament(runId: string) {
    setError(null)
    setOpeningRunId(runId)

    try {
      const openedTournament = await openTournament(runId)
      setTournaments((current) =>
        current.map((tournament) => (tournament.id === runId ? openedTournament : tournament)),
      )
    } catch (openError) {
      const message =
        openError instanceof Error ? openError.message : 'Unable to open tournament.'
      setError(message)
    } finally {
      setOpeningRunId((current) => (current === runId ? null : current))
    }
  }

  async function handleDeleteTournament(runId: string, name: string) {
    const confirmed =
      typeof window === 'undefined' ||
      window.confirm(
        `Delete "${name}"? This permanently removes the tournament run from ur-internals and public tournament listings.`,
      )

    if (!confirmed) {
      return
    }

    setError(null)
    setDeletingRunId(runId)

    try {
      await deleteTournament(runId)
      setTournaments((current) => current.filter((tournament) => tournament.id !== runId))
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Unable to delete tournament.'
      setError(message)
    } finally {
      setDeletingRunId((current) => (current === runId ? null : current))
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Tournaments"
        title="Tournament runs"
        description="Live list of tournament runs returned by the Nakama admin list RPC, including lifecycle, capacity, and scoring settings."
        actions={
          <ActionToolbar>
            <Link className="button button--primary" to={appRoutes.tournaments.create}>
              New tournament
            </Link>
          </ActionToolbar>
        }
      />

      {error ? <div className="alert alert--error">{error}</div> : null}

      <MetaStrip>
        <MetaStripItem
          label="Visible runs"
          value={isLoading ? '...' : tournaments.length}
          hint="Total rows returned by the admin list RPC."
          tone="accent"
        />
        <MetaStripItem
          label="Open now"
          value={isLoading ? '...' : openRuns}
          hint="Runs currently serving live tournament operations."
          tone="success"
        />
        <MetaStripItem
          label="Draft queue"
          value={isLoading ? '...' : draftRuns}
          hint="Runs staged but not yet opened to players."
          tone="warning"
        />
        <MetaStripItem
          label="Entrants tracked"
          value={isLoading ? '...' : totalEntrants}
          hint={isLoading ? 'Awaiting load.' : `${finalizedRuns} finalized runs in this view.`}
        />
      </MetaStrip>

      <SectionPanel
        title="All runs"
        subtitle="Backed by `rpc_admin_list_tournaments`."
      >
        {isLoading ? (
          <div className="empty-state">Loading tournaments...</div>
        ) : tournaments.length === 0 ? (
          <div className="empty-state">No tournament runs returned for this admin session.</div>
        ) : (
          <div className="table-wrap table-wrap--edge">
            <table className="table table--dense table--operations">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Structure</th>
                  <th>Start</th>
                  <th>Entries</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((tournament) => (
                  <tr
                    key={tournament.id}
                    className={
                      tournament.status === 'Draft'
                        ? 'table__row table__row--muted'
                        : 'table__row'
                    }
                  >
                    <td>
                      <div className="table__entity">
                        <div className="stack stack--compact">
                          <strong>{tournament.name}</strong>
                          <span className="muted mono">{tournament.id}</span>
                        </div>
                        <span className="table__subline">
                          {tournament.operator.toUpperCase()} operator
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={tournament.status} />
                    </td>
                    <td>
                        <div className="stack stack--compact">
                          <strong>{getTournamentStructureLabel(tournament.gameMode)}</strong>
                          <span className="muted">{tournament.roundCount} rounds</span>
                          <span className="muted">{formatTournamentBotSummary(tournament)}</span>
                        </div>
                      </td>
                    <td>
                      <div className="stack stack--compact">
                        <strong>{formatDateTime(tournament.startAt)}</strong>
                        <span className="muted">Created {formatDateTime(tournament.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="stack stack--compact">
                        <strong>
                          {tournament.entrants}/{tournament.maxEntrants}
                        </strong>
                        <span className="muted">
                          {Math.round((tournament.entrants / Math.max(1, tournament.maxEntrants)) * 100)}% full
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="table__actions">
                        <Link className="table__link" to={appRoutes.tournaments.detail(tournament.id)}>
                          Control room
                        </Link>
                        {tournament.status === 'Draft' ? (
                          <button
                            className="button button--primary"
                            type="button"
                            disabled={openingRunId === tournament.id || deletingRunId === tournament.id}
                            onClick={() => {
                              void handleOpenTournament(tournament.id)
                            }}
                          >
                            {openingRunId === tournament.id ? 'Opening...' : 'Open'}
                          </button>
                        ) : null}
                        {canDeleteTournaments ? (
                          <button
                            className="button button--danger"
                            type="button"
                            disabled={deletingRunId === tournament.id || openingRunId === tournament.id}
                            onClick={() => {
                              void handleDeleteTournament(tournament.id, tournament.name)
                            }}
                          >
                            {deletingRunId === tournament.id ? 'Deleting...' : 'Delete'}
                          </button>
                        ) : null}
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

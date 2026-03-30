import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import { getTournamentAuditLog } from '../api/auditLog'
import {
  deleteTournament,
  exportTournament,
  finalizeTournament,
  getTournament,
  getTournamentStandings,
  openTournament,
} from '../api/tournaments'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { getTournamentStructureLabel } from '../tournamentStructure'
import { formatSingleEliminationRoundLabel } from '../tournamentSizing'
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
        detail: `This spot will fill once the prior result is confirmed.`,
      }
    }

    if (!entry.playerAUserId && entry.playerBUserId) {
      return {
        key: entry.entryId,
        headline: `Match ${slot}: ${playerB} has advanced and is waiting for an opponent.`,
        detail: `This spot will fill once the prior result is confirmed.`,
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
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloadingExport, setIsDownloadingExport] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canDeleteTournaments = adminIdentity?.role === 'admin'
  const canFinalizeTournaments = adminIdentity?.role === 'admin'

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

  async function handleFinalizeTournament() {
    if (!tournament) {
      return
    }

    setError(null)
    setIsFinalizing(true)

    try {
      const finalizedTournament = await finalizeTournament(tournament.id)
      const [nextStandings, nextAuditLog] = await Promise.all([
        getTournamentStandings(finalizedTournament.id, 100),
        getTournamentAuditLog(finalizedTournament.id, 50),
      ])

      setTournament(finalizedTournament)
      setStandings(nextStandings)
      setAuditEntries(nextAuditLog)
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
      const bundle = await exportTournament(tournament.id)
      const payload = {
        exportedAt: bundle.exportedAt,
        tournament,
        standings,
        auditEntries,
        raw: bundle,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
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

  const historyRounds = tournament ? buildTournamentHistoryRounds(tournament, standings) : []

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
            <span className="meta-label">Bracket rounds</span>
            <strong>{formatSingleEliminationRoundLabel(tournament.roundCount)}</strong>
          </div>
          <div className="metric-card">
            <span className="meta-label">XP per match win</span>
            <strong>{tournament.xpPerMatchWin}</strong>
          </div>
          <div className="metric-card">
            <span className="meta-label">Champion XP</span>
            <strong>{tournament.xpForTournamentChampion}</strong>
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
              <span className="meta-label">XP per match win</span>
              <strong>{tournament.xpPerMatchWin}</strong>
            </div>
            <div className="metric-card">
              <span className="meta-label">Champion XP</span>
              <strong>{tournament.xpForTournamentChampion}</strong>
            </div>
            <div className="metric-card">
              <span className="meta-label">Finish rule</span>
              <strong>Automatic on champion</strong>
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

      <section className="panel stack">
        <div className="panel__header">
          <div>
            <h3 className="panel__title">Tournament history</h3>
            <span className="panel__subtitle">
              Single-elimination bracket results grouped into round-by-round summaries.
            </span>
          </div>
        </div>

        {historyRounds.length === 0 ? (
          <div className="empty-state">
            {tournament.bracket
              ? 'Bracket history is still being assembled for this run.'
              : 'Round history appears once the tournament field locks and bracket pairings are created.'}
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

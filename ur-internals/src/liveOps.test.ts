import {
  buildTournamentExportFallbackBundle,
  buildTournamentLiveOverviewData,
  buildTournamentLiveOverviewKpis,
} from './liveOps'
import type { AuditLogEntry } from './types/audit'
import type { Tournament, TournamentStandings } from './types/tournament'

function createTournament(overrides: Partial<Tournament>): Tournament {
  return {
    id: 'run-1',
    tournamentId: 'run-1',
    name: 'Test Tournament',
    description: 'Test description',
    status: 'Open',
    gameMode: 'standard',
    entrants: 2,
    maxEntrants: 2,
    startAt: '2026-03-30T11:00:00.000Z',
    endAt: '2026-03-30T13:00:00.000Z',
    buyIn: 'Free',
    region: 'Global',
    prizePool: 'Not configured',
    bots: {
      autoAdd: false,
      difficulty: null,
      count: 0,
    },
    createdBy: 'Admin',
    createdAt: '2026-03-30T10:30:00.000Z',
    updatedAt: '2026-03-30T11:00:00.000Z',
    category: 0,
    authoritative: true,
    joinRequired: true,
    enableRanks: true,
    operator: 'incr',
    roundCount: 1,
    xpPerMatchWin: 100,
    xpForTournamentChampion: 250,
    metadata: {},
    registrations: [
      {
        userId: 'user-1',
        displayName: 'Alpha',
        joinedAt: '2026-03-30T10:31:00.000Z',
        seed: 1,
      },
      {
        userId: 'user-2',
        displayName: 'Beta',
        joinedAt: '2026-03-30T10:32:00.000Z',
        seed: 2,
      },
    ],
    bracket: {
      format: 'single_elimination',
      size: 2,
      totalRounds: 1,
      startedAt: '2026-03-30T11:00:00.000Z',
      lockedAt: '2026-03-30T11:00:00.000Z',
      finalizedAt: null,
      winnerUserId: null,
      runnerUpUserId: null,
      participants: [
        {
          userId: 'user-1',
          displayName: 'Alpha',
          joinedAt: '2026-03-30T10:31:00.000Z',
          seed: 1,
          state: 'waiting_next_round',
          currentRound: 1,
          currentEntryId: 'round-1-match-1',
          activeMatchId: null,
          finalPlacement: null,
          lastResult: null,
          updatedAt: '2026-03-30T11:00:00.000Z',
        },
        {
          userId: 'user-2',
          displayName: 'Beta',
          joinedAt: '2026-03-30T10:32:00.000Z',
          seed: 2,
          state: 'waiting_next_round',
          currentRound: 1,
          currentEntryId: 'round-1-match-1',
          activeMatchId: null,
          finalPlacement: null,
          lastResult: null,
          updatedAt: '2026-03-30T11:00:00.000Z',
        },
      ],
      entries: [
        {
          entryId: 'round-1-match-1',
          round: 1,
          slot: 1,
          sourceEntryIds: [],
          playerAUserId: 'user-1',
          playerBUserId: 'user-2',
          playerAUsername: null,
          playerBUsername: null,
          matchId: null,
          status: 'ready',
          winnerUserId: null,
          loserUserId: null,
          playerAScore: null,
          playerBScore: null,
          createdAt: '2026-03-30T11:00:00.000Z',
          updatedAt: '2026-03-30T11:00:00.000Z',
          readyAt: '2026-03-30T11:00:00.000Z',
          startedAt: null,
          completedAt: null,
        },
      ],
    },
    finalSnapshot: null,
    openedAt: '2026-03-30T11:00:00.000Z',
    closedAt: null,
    finalizedAt: null,
    ...overrides,
  }
}

describe('live ops helpers', () => {
  it('sorts overview summaries by urgency, emits alerts, and buckets activity timelines', () => {
    const generatedAt = '2026-03-30T12:00:00.000Z'
    const staleTournament = createTournament({
      id: 'stale-run',
      tournamentId: 'stale-run',
      name: 'Stale Run',
      updatedAt: '2026-03-30T11:10:00.000Z',
      bracket: {
        ...createTournament({}).bracket!,
        entries: [
          {
            ...createTournament({}).bracket!.entries[0],
            status: 'ready',
            readyAt: '2026-03-30T11:20:00.000Z',
            updatedAt: '2026-03-30T11:20:00.000Z',
          },
        ],
      },
    })
    const activeTournament = createTournament({
      id: 'active-run',
      tournamentId: 'active-run',
      name: 'Active Run',
      updatedAt: '2026-03-30T11:55:00.000Z',
      bracket: {
        ...createTournament({}).bracket!,
        participants: createTournament({}).bracket!.participants.map((participant) => ({
          ...participant,
          state: 'in_match',
          activeMatchId: 'active-match',
          updatedAt: '2026-03-30T11:55:00.000Z',
        })),
        entries: [
          {
            ...createTournament({}).bracket!.entries[0],
            status: 'in_match',
            matchId: 'active-match',
            startedAt: '2026-03-30T11:55:00.000Z',
            updatedAt: '2026-03-30T11:55:00.000Z',
          },
        ],
      },
    })
    const auditEntries: AuditLogEntry[] = [
      {
        id: 'audit-1',
        action: 'match.recorded',
        actor: 'Admin',
        actorUserId: 'admin-1',
        target: 'Stale Run',
        tournamentId: 'stale-run',
        createdAt: '2026-03-30T11:20:00.000Z',
        summary: 'Ready too long',
        metadata: {},
      },
      {
        id: 'audit-2',
        action: 'match.launched',
        actor: 'Admin',
        actorUserId: 'admin-1',
        target: 'Active Run',
        tournamentId: 'active-run',
        createdAt: '2026-03-30T11:55:00.000Z',
        summary: 'Active match launched',
        metadata: {},
      },
    ]

    const overview = buildTournamentLiveOverviewData(
      [activeTournament, staleTournament],
      auditEntries,
      generatedAt,
    )
    const kpis = buildTournamentLiveOverviewKpis(overview.summaries)

    expect(overview.summaries[0]).toEqual(
      expect.objectContaining({
        runId: 'stale-run',
        actionNeeded: true,
        alerts: expect.arrayContaining([expect.objectContaining({ code: 'stale_match' })]),
      }),
    )
    expect(overview.summaries[1]).toEqual(
      expect.objectContaining({
        runId: 'active-run',
        activeMatches: 1,
        alerts: expect.arrayContaining([expect.objectContaining({ code: 'active_matches' })]),
      }),
    )
    expect(kpis).toEqual({
      openRuns: 2,
      startingSoon: 0,
      activeMatches: 1,
      waitingPlayers: 2,
      actionNeeded: 1,
      finalizeReady: 0,
    })
    expect(overview.activeMatchesByRound).toEqual([{ round: 1, count: 1 }])
    expect(overview.auditActivityTimeline.reduce((total, bucket) => total + bucket.count, 0)).toBe(2)
  })

  it('builds a canonical fallback export bundle from finalized data', () => {
    const tournament = createTournament({
      id: 'finalized-run',
      tournamentId: 'finalized-run',
      status: 'Finalized',
      updatedAt: '2026-03-30T11:40:00.000Z',
      finalizedAt: '2026-03-30T11:40:00.000Z',
      bracket: {
        ...createTournament({}).bracket!,
        finalizedAt: '2026-03-30T11:40:00.000Z',
        winnerUserId: 'user-1',
        runnerUpUserId: 'user-2',
        participants: [
          {
            ...createTournament({}).bracket!.participants[0],
            state: 'champion',
            finalPlacement: 1,
            lastResult: 'win',
          },
          {
            ...createTournament({}).bracket!.participants[1],
            state: 'runner_up',
            finalPlacement: 2,
            lastResult: 'loss',
          },
        ],
        entries: [
          {
            ...createTournament({}).bracket!.entries[0],
            status: 'completed',
            matchId: 'final-match',
            startedAt: '2026-03-30T11:32:00.000Z',
            completedAt: '2026-03-30T11:36:00.000Z',
            winnerUserId: 'user-1',
            loserUserId: 'user-2',
            updatedAt: '2026-03-30T11:36:00.000Z',
          },
        ],
      },
    })
    const standings: TournamentStandings = {
      generatedAt: '2026-03-30T11:40:00.000Z',
      rankCount: 2,
      entries: [
        {
          rank: 1,
          ownerId: 'user-1',
          username: 'Alpha',
          score: 1,
          subscore: 7,
          attempts: 1,
          maxAttempts: 1,
          matchId: 'final-match',
          round: 1,
          result: 'win',
          updatedAt: '2026-03-30T11:36:00.000Z',
          metadata: { round: 1, result: 'win', matchId: 'final-match' },
        },
        {
          rank: 2,
          ownerId: 'user-2',
          username: 'Beta',
          score: 0,
          subscore: 4,
          attempts: 1,
          maxAttempts: 1,
          matchId: 'final-match',
          round: 1,
          result: 'loss',
          updatedAt: '2026-03-30T11:36:00.000Z',
          metadata: { round: 1, result: 'loss', matchId: 'final-match' },
        },
      ],
    }
    const auditEntries: AuditLogEntry[] = [
      {
        id: 'audit-finalized',
        action: 'rpc_admin_finalize_tournament',
        actor: 'Admin',
        actorUserId: 'admin-1',
        target: 'Finalized Run',
        tournamentId: 'finalized-run',
        createdAt: '2026-03-30T11:40:00.000Z',
        summary: 'Tournament finalized',
        metadata: { disabledRanks: true },
      },
    ]

    const bundle = buildTournamentExportFallbackBundle(
      tournament,
      standings,
      auditEntries,
      '2026-03-30T12:00:00.000Z',
    )

    expect(bundle.run).toEqual(
      expect.objectContaining({
        runId: 'finalized-run',
        lifecycle: 'finalized',
      }),
    )
    expect(bundle.standings.records).toEqual(
      expect.arrayContaining([expect.objectContaining({ owner_id: 'user-1' })]),
    )
    expect(bundle.auditEntries).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'audit-finalized' })]),
    )
    expect(bundle.matchResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resultId: 'finalized-run:final-match',
          summary: expect.objectContaining({
            winnerUserId: 'user-1',
          }),
        }),
      ]),
    )
  })
})

export type TournamentStatus = 'Draft' | 'Open' | 'Closed' | 'Finalized'
export type TournamentOperator = 'best' | 'set' | 'incr'
export type TournamentLiveAlertLevel = 'info' | 'warning' | 'critical' | 'success'
export type TournamentBracketParticipantState =
  | 'lobby'
  | 'in_match'
  | 'waiting_next_round'
  | 'eliminated'
  | 'runner_up'
  | 'champion'
export type TournamentBracketEntryStatus = 'pending' | 'ready' | 'in_match' | 'completed'

export interface TournamentRegistration {
  userId: string
  displayName: string
  joinedAt: string
  seed: number
}

export interface TournamentBracketParticipant extends TournamentRegistration {
  state: TournamentBracketParticipantState
  currentRound: number | null
  currentEntryId: string | null
  activeMatchId: string | null
  finalPlacement: number | null
  lastResult: 'win' | 'loss' | null
  updatedAt: string
}

export interface TournamentBracketEntry {
  entryId: string
  round: number
  slot: number
  sourceEntryIds: string[]
  playerAUserId: string | null
  playerBUserId: string | null
  playerAUsername: string | null
  playerBUsername: string | null
  matchId: string | null
  status: TournamentBracketEntryStatus
  winnerUserId: string | null
  loserUserId: string | null
  playerAScore: number | null
  playerBScore: number | null
  createdAt: string
  updatedAt: string
  readyAt: string | null
  startedAt: string | null
  completedAt: string | null
}

export interface TournamentBracket {
  format: 'single_elimination'
  size: number
  totalRounds: number
  startedAt: string
  lockedAt: string
  finalizedAt: string | null
  winnerUserId: string | null
  runnerUpUserId: string | null
  participants: TournamentBracketParticipant[]
  entries: TournamentBracketEntry[]
}

export interface TournamentSnapshot {
  generatedAt: string
  overrideExpiry: number
  rankCount: number | null
  records: Array<Record<string, unknown>>
  prevCursor: string | null
  nextCursor: string | null
}

export interface Tournament {
  id: string
  tournamentId: string
  name: string
  description: string
  status: TournamentStatus
  gameMode: string
  entrants: number
  maxEntrants: number
  startAt: string
  endAt: string | null
  buyIn: string
  region: string
  prizePool: string
  createdBy: string
  createdAt: string
  updatedAt: string
  category: number
  authoritative: boolean
  joinRequired: boolean
  enableRanks: boolean
  operator: TournamentOperator
  roundCount: number
  xpPerMatchWin: number
  xpForTournamentChampion: number
  metadata: Record<string, unknown>
  registrations: TournamentRegistration[]
  bracket: TournamentBracket | null
  finalSnapshot: TournamentSnapshot | null
  openedAt: string | null
  closedAt: string | null
  finalizedAt: string | null
}

export interface TournamentEntry {
  rank: number | null
  ownerId: string
  username: string
  score: number
  subscore: number
  attempts: number | null
  maxAttempts: number | null
  matchId: string | null
  round: number | null
  result: string | null
  updatedAt: string | null
  metadata: Record<string, unknown>
}

export interface TournamentStandings {
  entries: TournamentEntry[]
  rankCount: number | null
  generatedAt: string | null
}

export interface TournamentLiveAlert {
  code:
    | 'starting_soon'
    | 'ready_matches'
    | 'active_matches'
    | 'waiting_players'
    | 'stale_match'
    | 'finalize_ready'
    | 'finalized'
  level: TournamentLiveAlertLevel
  message: string
  count: number
}

export interface TournamentParticipantStateCounts {
  lobby: number
  inMatch: number
  waitingNextRound: number
  eliminated: number
  runnerUp: number
  champion: number
}

export interface TournamentRoundStats {
  round: number
  label: string
  totalMatches: number
  pending: number
  ready: number
  inMatch: number
  completed: number
  completionPercent: number
}

export interface TournamentLiveEntry {
  entryId: string
  round: number
  slot: number
  status: TournamentBracketEntryStatus
  playerAUserId: string | null
  playerADisplayName: string | null
  playerBUserId: string | null
  playerBDisplayName: string | null
  winnerUserId: string | null
  loserUserId: string | null
  matchId: string | null
  readyAt: string | null
  startedAt: string | null
  completedAt: string | null
  durationSeconds: number | null
  stale: boolean
  staleReason: string | null
  blockedReason: string | null
}

export interface TournamentLiveSummary {
  runId: string
  tournamentId: string
  title: string
  lifecycle: TournamentStatus
  startAt: string | null
  openedAt: string | null
  closedAt: string | null
  finalizedAt: string | null
  updatedAt: string
  entrants: number
  capacity: number
  registrationFillPercent: number
  currentRound: number | null
  totalRounds: number | null
  totalMatches: number
  completedMatches: number
  pendingMatches: number
  readyMatches: number
  activeMatches: number
  waitingPlayers: number
  playersInMatch: number
  lastActivityAt: string | null
  lastResultAt: string | null
  startingSoon: boolean
  finalizeReady: boolean
  actionNeeded: boolean
  urgencyScore: number
  alerts: TournamentLiveAlert[]
}

export interface TournamentTimelineBucket {
  bucketStart: string
  bucketEnd: string
  count: number
}

export interface TournamentActiveMatchesByRound {
  round: number
  count: number
}

export interface TournamentMatchDurationBucket {
  label: string
  minSeconds: number | null
  maxSeconds: number | null
  count: number
}

export interface TournamentSeedSurvivalPoint {
  round: number
  label: string
  survivingCount: number
  topSeedRemaining: number | null
  averageSeedRemaining: number | null
}

export interface TournamentLiveOverviewData {
  generatedAt: string
  summaries: TournamentLiveSummary[]
  activeMatchesByRound: TournamentActiveMatchesByRound[]
  completionsOverTime: TournamentTimelineBucket[]
  auditActivityTimeline: TournamentTimelineBucket[]
}

export interface TournamentLiveDetailData {
  generatedAt: string
  summary: TournamentLiveSummary
  roundStats: TournamentRoundStats[]
  participantStateCounts: TournamentParticipantStateCounts
  liveEntries: TournamentLiveEntry[]
  matchDurationBuckets: TournamentMatchDurationBucket[]
  seedSurvival: TournamentSeedSurvivalPoint[]
  auditActivityTimeline: TournamentTimelineBucket[]
}

export interface CreateTournamentInput {
  runId?: string
  name: string
  description: string
  gameMode: string
  entrants: number
  startAt: string
  joinRequired: boolean
  enableRanks: boolean
  xpPerMatchWin: number
  xpForTournamentChampion: number
}

export interface TournamentExportBundle {
  exportedAt: string
  run: Record<string, unknown>
  nakamaTournament: Record<string, unknown> | null
  standings: TournamentSnapshot
  auditEntries: Array<Record<string, unknown>>
  matchResults: Array<Record<string, unknown>>
}

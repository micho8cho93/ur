export type TournamentStatus = 'Draft' | 'Open' | 'Closed' | 'Finalized'
export type TournamentOperator = 'best' | 'set' | 'incr'

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

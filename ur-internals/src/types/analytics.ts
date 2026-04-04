export type AnalyticsAvailabilityStatus =
  | 'available'
  | 'partial'
  | 'no_data'
  | 'not_enough_data'
  | 'tracking_missing'

export interface AnalyticsAvailability {
  status: AnalyticsAvailabilityStatus
  hasData: boolean
  sampleSize: number | null
  notes: string[]
}

export interface AnalyticsFilters {
  startDate: string
  endDate: string
  tournamentId: string | null
  gameMode: string | null
  eloMin: number | null
  eloMax: number | null
  limit: number
}

export interface AnalyticsQueryFilters {
  startDate: string
  endDate: string
  tournamentId: string | null
  gameMode: string | null
  eloMin: number | null
  eloMax: number | null
  limit: number
}

export interface AnalyticsResponse<TData> {
  success: true
  filters: AnalyticsFilters
  generatedAt: string
  dataAvailability: {
    hasEnoughData: boolean
    notes: string[]
  }
  data: TData
}

export interface AnalyticsMetric {
  value: number | null
  numerator: number | null
  denominator: number | null
  previousValue: number | null
  availability: AnalyticsAvailability
}

export interface CountPoint {
  date: string
  value: number
}

export interface DualCountPoint {
  date: string
  primary: number
  secondary: number
  total: number
}

export interface RatePoint {
  date: string
  value: number | null
  numerator: number
  denominator: number
}

export interface DistributionBucket {
  key: string
  label: string
  count: number
  min: number | null
  max: number | null
}

export interface RankedSegment {
  key: string
  label: string
  count: number
  wins: number | null
  losses: number | null
  winRate: number | null
}

export interface AnalyticsTableRow {
  id: string
  userId: string | null
  label: string
  secondaryLabel: string | null
  metrics: Record<string, number | string | null>
}

export interface RealtimeEventRow {
  id: string
  type: string
  occurredAt: string
  label: string
  detail: string | null
  status: 'neutral' | 'success' | 'warning' | 'danger'
}

export interface RealtimeActiveMatchRow {
  matchId: string
  startedAt: string
  modeId: string
  tournamentRunId: string | null
  playerLabels: string[]
}

export interface AnalyticsSummaryData {
  dau: AnalyticsMetric
  wau: AnalyticsMetric
  matchesPlayed: AnalyticsMetric
  completionRate: AnalyticsMetric
  medianMatchDurationSeconds: AnalyticsMetric
  activeTournaments: AnalyticsMetric
  tournamentsCompleted: AnalyticsMetric
  currentOnlinePlayers: AnalyticsMetric
  disconnectRate: AnalyticsMetric
}

export interface AnalyticsOverviewData {
  dauTrend: {
    availability: AnalyticsAvailability
    points: CountPoint[]
  }
  wauTrend: {
    availability: AnalyticsAvailability
    points: CountPoint[]
  }
  matchesPerDay: {
    availability: AnalyticsAvailability
    points: CountPoint[]
  }
  completionRateTrend: {
    availability: AnalyticsAvailability
    points: RatePoint[]
  }
  newVsReturningPlayers: {
    availability: AnalyticsAvailability
    points: DualCountPoint[]
  }
  totalPlayers: AnalyticsMetric
  tournamentsCreated: AnalyticsMetric
  tournamentsCompleted: AnalyticsMetric
}

export interface AnalyticsPlayersData {
  uniquePlayers: AnalyticsMetric
  newPlayersOverTime: {
    availability: AnalyticsAvailability
    points: CountPoint[]
  }
  returningPlayersOverTime: {
    availability: AnalyticsAvailability
    points: CountPoint[]
  }
  activityBuckets: {
    availability: AnalyticsAvailability
    buckets: Array<{
      key: string
      label: string
      count: number
    }>
  }
  topPlayers: {
    availability: AnalyticsAvailability
    rows: AnalyticsTableRow[]
  }
  retention: {
    availability: AnalyticsAvailability
    d1: AnalyticsMetric
    d7: AnalyticsMetric
    d30: AnalyticsMetric
  }
}

export interface AnalyticsGameplayData {
  matchesPerDay: {
    availability: AnalyticsAvailability
    points: CountPoint[]
  }
  startedVsCompleted: {
    availability: AnalyticsAvailability
    points: Array<{
      date: string
      started: number
      completed: number
      abandoned: number
    }>
  }
  completionFunnel: {
    availability: AnalyticsAvailability
    started: number
    completed: number
    disconnect: number
    inactivity: number
    abandoned: number
  }
  durationDistribution: {
    availability: AnalyticsAvailability
    buckets: DistributionBucket[]
  }
  winRateByMode: {
    availability: AnalyticsAvailability
    segments: RankedSegment[]
  }
  winRateByTurnOrder: {
    availability: AnalyticsAvailability
  }
  disconnectRate: AnalyticsMetric
  captureRate: AnalyticsMetric
  recentMatches: {
    availability: AnalyticsAvailability
    rows: AnalyticsTableRow[]
  }
}

export interface AnalyticsTournamentsData {
  createdOverTime: {
    availability: AnalyticsAvailability
    points: CountPoint[]
  }
  participationCounts: {
    availability: AnalyticsAvailability
    buckets: DistributionBucket[]
  }
  completionRate: AnalyticsMetric
  dropoutByRound: {
    availability: AnalyticsAvailability
    buckets: Array<{
      round: number
      label: string
      count: number
    }>
  }
  durationDistribution: {
    availability: AnalyticsAvailability
    buckets: DistributionBucket[]
  }
  recentTournaments: {
    availability: AnalyticsAvailability
    rows: AnalyticsTableRow[]
  }
}

export interface AnalyticsProgressionData {
  eloDistribution: {
    availability: AnalyticsAvailability
    buckets: DistributionBucket[]
  }
  rankDistribution: {
    availability: AnalyticsAvailability
    buckets: DistributionBucket[]
  }
  ratingMovement: {
    availability: AnalyticsAvailability
    points: Array<{
      date: string
      medianAbsoluteDelta: number | null
      ratedMatches: number
    }>
  }
  xpAwardedOverTime: {
    availability: AnalyticsAvailability
    points: CountPoint[]
  }
  recentRankUps: {
    availability: AnalyticsAvailability
    rows: AnalyticsTableRow[]
  }
}

export interface AnalyticsRealtimeData {
  onlinePlayers: AnalyticsMetric
  activeMatches: AnalyticsMetric
  activeTournaments: AnalyticsMetric
  queueSize: AnalyticsMetric
  queueWaitSeconds: AnalyticsMetric
  activeMatchRows: {
    availability: AnalyticsAvailability
    rows: RealtimeActiveMatchRow[]
  }
  recentEvents: {
    availability: AnalyticsAvailability
    rows: RealtimeEventRow[]
  }
  recentDisconnects: {
    availability: AnalyticsAvailability
    rows: RealtimeEventRow[]
  }
  freshness: {
    availability: AnalyticsAvailability
    lastEventAt: string | null
    generatedAt: string
  }
}

export interface AnalyticsDashboardBundle {
  summary: AnalyticsResponse<AnalyticsSummaryData>
  overview: AnalyticsResponse<AnalyticsOverviewData>
  players: AnalyticsResponse<AnalyticsPlayersData>
  gameplay: AnalyticsResponse<AnalyticsGameplayData>
  tournaments: AnalyticsResponse<AnalyticsTournamentsData>
  progression: AnalyticsResponse<AnalyticsProgressionData>
}

export type AnalyticsSectionId =
  | 'overview'
  | 'players'
  | 'gameplay'
  | 'tournaments'
  | 'progression'
  | 'realtime'

export interface AnalyticsTournamentFilterOption {
  id: string
  label: string
  gameMode: string | null
}

export type AnalyticsAvailabilityStatus =
  | "available"
  | "partial"
  | "no_data"
  | "not_enough_data"
  | "tracking_missing";

export type AnalyticsAvailability = {
  status: AnalyticsAvailabilityStatus;
  hasData: boolean;
  sampleSize: number | null;
  notes: string[];
};

export type AnalyticsFilters = {
  startDate: string;
  endDate: string;
  startMs: number;
  endMs: number;
  tournamentId: string | null;
  gameMode: string | null;
  eloMin: number | null;
  eloMax: number | null;
  limit: number;
};

export type AnalyticsResponse<TData> = {
  success: true;
  filters: Omit<AnalyticsFilters, "startMs" | "endMs">;
  generatedAt: string;
  dataAvailability: {
    hasEnoughData: boolean;
    notes: string[];
  };
  data: TData;
};

export type AnalyticsMetric = {
  value: number | null;
  numerator: number | null;
  denominator: number | null;
  previousValue: number | null;
  availability: AnalyticsAvailability;
};

export type CountPoint = {
  date: string;
  value: number;
};

export type DualCountPoint = {
  date: string;
  primary: number;
  secondary: number;
  total: number;
};

export type RatePoint = {
  date: string;
  value: number | null;
  numerator: number;
  denominator: number;
};

export type DistributionBucket = {
  key: string;
  label: string;
  count: number;
  min: number | null;
  max: number | null;
};

export type RankedSegment = {
  key: string;
  label: string;
  count: number;
  wins: number | null;
  losses: number | null;
  winRate: number | null;
};

export type AnalyticsTableRow = {
  id: string;
  userId: string | null;
  label: string;
  secondaryLabel: string | null;
  metrics: Record<string, number | string | null>;
};

export type RealtimeEventRow = {
  id: string;
  type: string;
  occurredAt: string;
  label: string;
  detail: string | null;
  status: "neutral" | "success" | "warning" | "danger";
};

export type RealtimeActiveMatchRow = {
  matchId: string;
  startedAt: string;
  modeId: string;
  tournamentRunId: string | null;
  playerLabels: string[];
};

export type AnalyticsSummaryData = {
  dau: AnalyticsMetric;
  wau: AnalyticsMetric;
  matchesPlayed: AnalyticsMetric;
  completionRate: AnalyticsMetric;
  medianMatchDurationSeconds: AnalyticsMetric;
  activeTournaments: AnalyticsMetric;
  tournamentsCompleted: AnalyticsMetric;
  currentOnlinePlayers: AnalyticsMetric;
  disconnectRate: AnalyticsMetric;
};

export type AnalyticsOverviewData = {
  dauTrend: {
    availability: AnalyticsAvailability;
    points: CountPoint[];
  };
  wauTrend: {
    availability: AnalyticsAvailability;
    points: CountPoint[];
  };
  matchesPerDay: {
    availability: AnalyticsAvailability;
    points: CountPoint[];
  };
  completionRateTrend: {
    availability: AnalyticsAvailability;
    points: RatePoint[];
  };
  newVsReturningPlayers: {
    availability: AnalyticsAvailability;
    points: DualCountPoint[];
  };
  totalPlayers: AnalyticsMetric;
  tournamentsCreated: AnalyticsMetric;
  tournamentsCompleted: AnalyticsMetric;
};

export type AnalyticsPlayersData = {
  uniquePlayers: AnalyticsMetric;
  newPlayersOverTime: {
    availability: AnalyticsAvailability;
    points: CountPoint[];
  };
  returningPlayersOverTime: {
    availability: AnalyticsAvailability;
    points: CountPoint[];
  };
  activityBuckets: {
    availability: AnalyticsAvailability;
    buckets: Array<{
      key: string;
      label: string;
      count: number;
    }>;
  };
  topPlayers: {
    availability: AnalyticsAvailability;
    rows: AnalyticsTableRow[];
  };
  retention: {
    availability: AnalyticsAvailability;
    d1: AnalyticsMetric;
    d7: AnalyticsMetric;
    d30: AnalyticsMetric;
  };
};

export type AnalyticsGameplayData = {
  matchesPerDay: {
    availability: AnalyticsAvailability;
    points: CountPoint[];
  };
  startedVsCompleted: {
    availability: AnalyticsAvailability;
    points: Array<{
      date: string;
      started: number;
      completed: number;
      abandoned: number;
    }>;
  };
  completionFunnel: {
    availability: AnalyticsAvailability;
    started: number;
    completed: number;
    disconnect: number;
    inactivity: number;
    abandoned: number;
  };
  durationDistribution: {
    availability: AnalyticsAvailability;
    buckets: DistributionBucket[];
  };
  winRateByMode: {
    availability: AnalyticsAvailability;
    segments: RankedSegment[];
  };
  winRateByTurnOrder: {
    availability: AnalyticsAvailability;
  };
  disconnectRate: AnalyticsMetric;
  captureRate: AnalyticsMetric;
  recentMatches: {
    availability: AnalyticsAvailability;
    rows: AnalyticsTableRow[];
  };
};

export type AnalyticsTournamentsData = {
  createdOverTime: {
    availability: AnalyticsAvailability;
    points: CountPoint[];
  };
  participationCounts: {
    availability: AnalyticsAvailability;
    buckets: DistributionBucket[];
  };
  completionRate: AnalyticsMetric;
  dropoutByRound: {
    availability: AnalyticsAvailability;
    buckets: Array<{
      round: number;
      label: string;
      count: number;
    }>;
  };
  durationDistribution: {
    availability: AnalyticsAvailability;
    buckets: DistributionBucket[];
  };
  recentTournaments: {
    availability: AnalyticsAvailability;
    rows: AnalyticsTableRow[];
  };
};

export type AnalyticsProgressionData = {
  eloDistribution: {
    availability: AnalyticsAvailability;
    buckets: DistributionBucket[];
  };
  rankDistribution: {
    availability: AnalyticsAvailability;
    buckets: DistributionBucket[];
  };
  ratingMovement: {
    availability: AnalyticsAvailability;
    points: Array<{
      date: string;
      medianAbsoluteDelta: number | null;
      ratedMatches: number;
    }>;
  };
  xpAwardedOverTime: {
    availability: AnalyticsAvailability;
    points: CountPoint[];
  };
  recentRankUps: {
    availability: AnalyticsAvailability;
    rows: AnalyticsTableRow[];
  };
};

export type AnalyticsRealtimeData = {
  onlinePlayers: AnalyticsMetric;
  activeMatches: AnalyticsMetric;
  activeTournaments: AnalyticsMetric;
  queueSize: AnalyticsMetric;
  queueWaitSeconds: AnalyticsMetric;
  activeMatchRows: {
    availability: AnalyticsAvailability;
    rows: RealtimeActiveMatchRow[];
  };
  recentEvents: {
    availability: AnalyticsAvailability;
    rows: RealtimeEventRow[];
  };
  recentDisconnects: {
    availability: AnalyticsAvailability;
    rows: RealtimeEventRow[];
  };
  freshness: {
    availability: AnalyticsAvailability;
    lastEventAt: string | null;
    generatedAt: string;
  };
};

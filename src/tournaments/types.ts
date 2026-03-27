export type TournamentMembershipState = {
  isJoined: boolean;
  joinedAt: string | null;
};

export type PublicTournamentSummary = {
  runId: string;
  tournamentId: string;
  name: string;
  description: string;
  lifecycle: 'draft' | 'open' | 'closed' | 'finalized';
  startAt: string;
  endAt: string | null;
  updatedAt: string;
  entrants: number;
  maxEntrants: number;
  gameMode: string;
  region: string;
  buyInLabel: string;
  prizeLabel: string;
  membership: TournamentMembershipState;
};

export type PublicTournamentDetail = PublicTournamentSummary;

export type PublicTournamentStanding = {
  rank: number | null;
  ownerId: string;
  username: string;
  score: number;
  subscore: number;
  attempts: number | null;
  maxAttempts: number | null;
  matchId: string | null;
  round: number | null;
  result: string | null;
  updatedAt: string | null;
  metadata: Record<string, unknown>;
};

export type TournamentMatchLaunchResult = {
  matchId: string;
  matchToken: string | null;
  tournamentRunId: string;
  tournamentId: string;
  tournamentRound: number | null;
  tournamentEntryId: string | null;
  playerState: string | null;
  nextRoundReady: boolean | null;
  statusMessage: string | null;
  queueStatus: string | null;
  statusMetadata: Record<string, unknown>;
};

export type PublicTournamentStatusSnapshot = {
  tournament: PublicTournamentDetail;
  standings: PublicTournamentStanding[];
};

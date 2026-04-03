import type { BotDifficulty } from '@/logic/bot/types';

export type TournamentMembershipState = {
  isJoined: boolean;
  joinedAt: string | null;
};

export type TournamentParticipationState = {
  state: 'lobby' | 'in_match' | 'waiting_next_round' | 'eliminated' | 'runner_up' | 'champion' | null;
  currentRound: number | null;
  currentEntryId: string | null;
  activeMatchId: string | null;
  finalPlacement: number | null;
  lastResult: 'win' | 'loss' | null;
  canLaunch: boolean;
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
  lobbyDeadlineAt?: string | null;
  entrants: number;
  maxEntrants: number;
  gameMode: string;
  region: string;
  buyInLabel: string;
  prizeLabel: string;
  xpPerMatchWin?: number | null;
  xpForTournamentChampion?: number | null;
  bots: {
    autoAdd: boolean;
    difficulty: BotDifficulty | null;
    count: number;
  };
  isLocked: boolean;
  currentRound: number | null;
  membership: TournamentMembershipState;
  participation: TournamentParticipationState;
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

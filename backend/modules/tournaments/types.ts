export type RuntimeContext = any;
export type RuntimeLogger = any;
export type RuntimeNakama = any;
export type RuntimeInitializer = any;

export type RuntimeMetadata = Record<string, unknown>;
export type AdminRole = "viewer" | "operator" | "admin";

export type TournamentStatus = "draft" | "scheduled" | "live" | "complete" | "cancelled";
export type TournamentParticipantStatus = "joined" | "checked_in" | "eliminated";

export interface TournamentParticipant {
  userId: string;
  displayName: string;
  joinedAt: string;
  status: TournamentParticipantStatus;
  seed: number | null;
}

export interface TournamentMatchResult {
  matchId: string;
  round: number;
  submittedByUserId: string;
  submittedAt: string;
  playerAUserId: string;
  playerBUserId: string;
  scoreA: number;
  scoreB: number;
  winnerUserId: string | null;
  notes: string | null;
}

export interface TournamentScoringSettings {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  allowDraws: boolean;
}

export interface TournamentRewardTier {
  rank: number;
  title: string;
  percentage: number;
}

export interface TournamentStanding {
  rank: number;
  userId: string;
  displayName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
  scoreDifference: number;
  buchholz: number;
  joinedAt: string;
  seed: number | null;
  rewardTitle: string | null;
  rewardAmount: number | null;
}

export interface TournamentRewardAllocation {
  rank: number;
  userId: string | null;
  displayName: string | null;
  title: string;
  amount: number | null;
  currency: string | null;
}

export interface TournamentRewardPlan {
  generatedAt: string;
  poolAmount: number | null;
  currency: string | null;
  notes: string | null;
  allocations: TournamentRewardAllocation[];
}

export interface TournamentAuditEntry {
  id: string;
  userId: string;
  action: string;
  targetId: string;
  timestamp: string;
  payloadSummary: RuntimeMetadata;
  actorUserId: string;
  actorLabel: string;
  tournamentId: string;
  tournamentName: string;
  createdAt: string;
  metadata: RuntimeMetadata;
}

export interface TournamentRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: TournamentStatus;
  startsAt: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  createdByLabel: string;
  region: string;
  gameMode: string;
  entryFee: string;
  maxParticipants: number;
  rewardCurrency: string | null;
  rewardPoolAmount: number | null;
  rewardNotes: string | null;
  tags: string[];
  scoring: TournamentScoringSettings;
  participants: TournamentParticipant[];
  results: TournamentMatchResult[];
}

export interface TournamentSummary {
  id: string;
  name: string;
  status: TournamentStatus;
  startsAt: string;
  updatedAt: string;
  region: string;
  gameMode: string;
  participantsCount: number;
  maxParticipants: number;
  rewardPoolAmount: number | null;
  rewardCurrency: string | null;
}

export interface TournamentIndexRecord {
  tournamentIds: string[];
  updatedAt: string;
}

export interface TournamentAuditLogRecord {
  entries: TournamentAuditEntry[];
  updatedAt: string;
}

export interface TournamentListRpcRequest {
  limit?: number;
  status?: TournamentStatus;
  search?: string;
}

export interface TournamentListRpcResponse {
  tournaments: TournamentSummary[];
  totalCount: number;
}

export interface TournamentDetailRpcRequest {
  tournamentId: string;
  includeAudit?: boolean;
  auditLimit?: number;
}

export interface TournamentDetailRpcResponse {
  tournament: TournamentRecord;
  standings: TournamentStanding[];
  rewards: TournamentRewardPlan;
  auditLog?: TournamentAuditEntry[];
}

export interface TournamentCreateRpcRequest {
  tournamentId?: string;
  name: string;
  description?: string;
  startsAt: string;
  region?: string;
  gameMode?: string;
  entryFee?: string;
  maxParticipants?: number;
  rewardCurrency?: string | null;
  rewardPoolAmount?: number | null;
  rewardNotes?: string;
  status?: TournamentStatus;
  tags?: string[];
}

export interface TournamentStatusUpdateRpcRequest {
  tournamentId: string;
  status: TournamentStatus;
}

export interface TournamentJoinRpcRequest {
  tournamentId: string;
  displayName?: string;
}

export interface TournamentJoinRpcResponse {
  tournament: TournamentSummary;
  participant: TournamentParticipant;
  joined: boolean;
}

export interface TournamentResultUpsertRpcRequest {
  tournamentId: string;
  matchId?: string;
  round?: number;
  playerAUserId: string;
  playerBUserId: string;
  scoreA: number;
  scoreB: number;
  notes?: string;
}

export interface TournamentStandingsRpcRequest {
  tournamentId: string;
}

export interface TournamentStandingsRpcResponse {
  tournamentId: string;
  standings: TournamentStanding[];
  rewards: TournamentRewardPlan;
  updatedAt: string;
}

export interface TournamentAuditLogRpcRequest {
  targetId?: string;
  tournamentId?: string;
  limit?: number;
}

export interface TournamentAuditLogRpcResponse {
  entries: TournamentAuditEntry[];
}

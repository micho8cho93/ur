import { Session } from '@heroiclabs/nakama-js';

import { nakamaService } from '@/services/nakama';
import type {
  PublicTournamentDetail,
  PublicTournamentStanding,
  PublicTournamentSummary,
  TournamentMatchLaunchResult,
  TournamentMembershipState,
} from '@/src/tournaments/types';

const RPC_LIST_PUBLIC_TOURNAMENTS = 'list_public_tournaments';
const RPC_GET_PUBLIC_TOURNAMENT = 'get_public_tournament';
const RPC_GET_PUBLIC_TOURNAMENT_STANDINGS = 'get_public_tournament_standings';
const RPC_JOIN_PUBLIC_TOURNAMENT = 'join_public_tournament';
const RPC_LAUNCH_TOURNAMENT_MATCH = 'launch_tournament_match';

type RpcPayloadRecord = Record<string, unknown>;

type StatusLikeError = {
  message?: string;
  error?: string;
  status?: number;
  statusText?: string;
};

const normalizeTournamentError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const responseLike = error as StatusLikeError;
    const message =
      typeof responseLike.message === 'string' && responseLike.message.trim().length > 0
        ? responseLike.message.trim()
        : typeof responseLike.error === 'string' && responseLike.error.trim().length > 0
          ? responseLike.error.trim()
          : null;

    if (message) {
      return new Error(message);
    }

    if (typeof responseLike.status === 'number') {
      return new Error(
        `Tournament request failed (${responseLike.status}${responseLike.statusText ? ` ${responseLike.statusText}` : ''}).`,
      );
    }
  }

  return new Error('Unable to load tournaments right now.');
};

const ensureSession = async (): Promise<Session> => nakamaService.ensureAuthenticatedDevice();

const asRecord = (value: unknown): RpcPayloadRecord | null =>
  typeof value === 'object' && value !== null ? (value as RpcPayloadRecord) : null;

const normalizeRpcPayload = (payload: unknown): RpcPayloadRecord => {
  if (typeof payload === 'string') {
    try {
      return asRecord(JSON.parse(payload)) ?? {};
    } catch {
      return {};
    }
  }

  return asRecord(payload) ?? {};
};

const readStringField = (value: unknown, keys: string[]): string | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === 'string' && field.trim().length > 0) {
      return field.trim();
    }
  }

  return null;
};

const readNumberField = (value: unknown, keys: string[]): number | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === 'number' && Number.isFinite(field)) {
      return field;
    }
  }

  return null;
};

const readArrayField = (value: unknown, keys: string[]): unknown[] => {
  const record = asRecord(value);
  if (!record) {
    return [];
  }

  for (const key of keys) {
    const field = record[key];
    if (Array.isArray(field)) {
      return field;
    }
  }

  return [];
};

const normalizeMembershipState = (value: unknown): TournamentMembershipState => {
  const record = asRecord(value);
  return {
    isJoined: record?.isJoined === true,
    joinedAt: readStringField(record, ['joinedAt', 'joined_at']),
  };
};

const normalizePublicTournament = (value: unknown): PublicTournamentDetail => {
  const record = asRecord(value) ?? {};

  return {
    runId: readStringField(record, ['runId', 'run_id']) ?? 'unknown-run',
    tournamentId: readStringField(record, ['tournamentId', 'tournament_id']) ?? 'unknown-tournament',
    name: readStringField(record, ['name', 'title']) ?? 'Unknown Tournament',
    description: readStringField(record, ['description']) ?? 'No description configured.',
    lifecycle:
      readStringField(record, ['lifecycle']) === 'closed'
        ? 'closed'
        : readStringField(record, ['lifecycle']) === 'finalized'
          ? 'finalized'
          : readStringField(record, ['lifecycle']) === 'draft'
            ? 'draft'
            : 'open',
    startAt: readStringField(record, ['startAt', 'start_at']) ?? new Date(0).toISOString(),
    endAt: readStringField(record, ['endAt', 'end_at']),
    updatedAt: readStringField(record, ['updatedAt', 'updated_at']) ?? new Date(0).toISOString(),
    entrants: Math.max(0, Math.floor(readNumberField(record, ['entrants']) ?? 0)),
    maxEntrants: Math.max(0, Math.floor(readNumberField(record, ['maxEntrants', 'max_entrants']) ?? 0)),
    gameMode: readStringField(record, ['gameMode', 'game_mode']) ?? 'standard',
    region: readStringField(record, ['region']) ?? 'Global',
    buyInLabel: readStringField(record, ['buyInLabel', 'buy_in_label']) ?? 'Free',
    prizeLabel: readStringField(record, ['prizeLabel', 'prize_label']) ?? 'No prize listed',
    membership: normalizeMembershipState(record.membership),
  };
};

const normalizeTournamentStanding = (value: unknown): PublicTournamentStanding => {
  const record = asRecord(value) ?? {};
  const metadata = asRecord(record.metadata) ?? {};

  return {
    rank: readNumberField(record, ['rank']),
    ownerId: readStringField(record, ['ownerId', 'owner_id']) ?? 'unknown-owner',
    username: readStringField(record, ['username']) ?? 'Unknown player',
    score: readNumberField(record, ['score']) ?? 0,
    subscore: readNumberField(record, ['subscore']) ?? 0,
    attempts: readNumberField(record, ['numScore', 'num_score']),
    maxAttempts: readNumberField(record, ['maxNumScore', 'max_num_score']),
    matchId: readStringField(metadata, ['matchId', 'match_id']),
    round: readNumberField(metadata, ['round']),
    result: readStringField(metadata, ['result']),
    updatedAt:
      readStringField(record, ['updateTime', 'update_time']) ??
      readStringField(record, ['createTime', 'create_time']),
    metadata,
  };
};

const callTournamentRpc = async (rpcName: string, payload: Record<string, unknown>): Promise<RpcPayloadRecord> => {
  const session = await ensureSession();
  const client = nakamaService.getClient();

  try {
    const response = await client.rpc(session, rpcName, payload);
    return normalizeRpcPayload(response.payload);
  } catch (error) {
    throw normalizeTournamentError(error);
  }
};

export type TournamentMatchLaunchServiceResult = TournamentMatchLaunchResult & {
  session: Session;
  userId: string;
};

export const listPublicTournaments = async (limit = 50): Promise<PublicTournamentSummary[]> => {
  const response = await callTournamentRpc(RPC_LIST_PUBLIC_TOURNAMENTS, { limit });
  return readArrayField(response, ['tournaments']).map((entry) => normalizePublicTournament(entry));
};

export const getPublicTournament = async (runId: string): Promise<PublicTournamentDetail> => {
  const response = await callTournamentRpc(RPC_GET_PUBLIC_TOURNAMENT, { runId });
  return normalizePublicTournament(response.tournament);
};

export const getPublicTournamentStandings = async (
  runId: string,
  limit?: number,
): Promise<PublicTournamentStanding[]> => {
  const response = await callTournamentRpc(RPC_GET_PUBLIC_TOURNAMENT_STANDINGS, {
    runId,
    ...(typeof limit === 'number' ? { limit } : {}),
  });
  const standings = asRecord(response.standings) ?? {};
  return readArrayField(standings, ['records']).map((entry) => normalizeTournamentStanding(entry));
};

export const joinPublicTournament = async (
  runId: string,
): Promise<{ tournament: PublicTournamentDetail; joined: boolean }> => {
  const response = await callTournamentRpc(RPC_JOIN_PUBLIC_TOURNAMENT, { runId });
  return {
    tournament: normalizePublicTournament(response.tournament),
    joined: response.joined === true,
  };
};

export const launchTournamentMatch = async (runId: string): Promise<TournamentMatchLaunchServiceResult> => {
  const session = await ensureSession();
  const client = nakamaService.getClient();

  try {
    const response = await client.rpc(session, RPC_LAUNCH_TOURNAMENT_MATCH, { runId });
    const payload = normalizeRpcPayload(response.payload);

    if (!session.user_id) {
      throw new Error('Authenticated session is missing user ID.');
    }

    return {
      matchId: readStringField(payload, ['matchId', 'match_id']) ?? '',
      matchToken: readStringField(payload, ['matchToken', 'match_token']),
      tournamentRunId:
        readStringField(payload, ['tournamentRunId', 'tournament_run_id']) ??
        readStringField(payload, ['runId', 'run_id']) ??
        runId,
      tournamentId: readStringField(payload, ['tournamentId', 'tournament_id']) ?? runId,
      session,
      userId: session.user_id,
    };
  } catch (error) {
    throw normalizeTournamentError(error);
  }
};

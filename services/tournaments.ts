import { Session } from '@heroiclabs/nakama-js';

import { nakamaService } from '@/services/nakama';
import { DEFAULT_BOT_DIFFICULTY, isBotDifficulty, type BotDifficulty } from '@/logic/bot/types';
import type {
  PublicTournamentDetail,
  PublicTournamentStanding,
  PublicTournamentStatusSnapshot,
  PublicTournamentSummary,
  TournamentMatchLaunchResult,
  TournamentMembershipState,
  TournamentParticipationState,
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
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
  clone?: () => {
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
  };
};

const isUnauthorizedTournamentError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as StatusLikeError;
  if (candidate.status === 401) {
    return true;
  }

  return typeof candidate.message === 'string' && /unauthorized|expired|token/i.test(candidate.message);
};

const readRpcErrorMessage = async (error: StatusLikeError): Promise<string | null> => {
  const directMessage =
    typeof error.message === 'string' && error.message.trim().length > 0
      ? error.message.trim()
      : typeof error.error === 'string' && error.error.trim().length > 0
        ? error.error.trim()
        : null;

  if (directMessage) {
    return directMessage;
  }

  const responseLike = typeof error.clone === 'function' ? error.clone() : error;
  if (typeof responseLike.json === 'function') {
    try {
      const payload = await responseLike.json();
      if (typeof payload === 'object' && payload !== null) {
        const record = payload as { message?: unknown; error?: unknown };
        if (typeof record.message === 'string' && record.message.trim().length > 0) {
          return record.message.trim();
        }
        if (typeof record.error === 'string' && record.error.trim().length > 0) {
          return record.error.trim();
        }
      }
    } catch {
      // Fall back to plain text when the response body is not valid JSON.
    }
  }

  if (typeof responseLike.text === 'function') {
    try {
      const text = await responseLike.text();
      if (!text || text.trim().length === 0) {
        return null;
      }

      try {
        const payload = JSON.parse(text) as { message?: unknown; error?: unknown };
        if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
          return payload.message.trim();
        }
        if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
          return payload.error.trim();
        }
      } catch {
        // Use the raw response text when it is not JSON.
      }

      return text.trim();
    } catch {
      return null;
    }
  }

  return null;
};

const normalizeTournamentError = async (error: unknown): Promise<Error> => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const responseLike = error as StatusLikeError;
    const message = await readRpcErrorMessage(responseLike);

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

const readBooleanField = (value: unknown, keys: string[]): boolean | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === 'boolean') {
      return field;
    }
  }

  return null;
};

const readRecordField = (value: unknown, keys: string[]): RpcPayloadRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = asRecord(record[key]);
    if (field) {
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

const normalizeParticipationState = (value: unknown): TournamentParticipationState => {
  const record = asRecord(value);
  const state = readStringField(record, ['state']);
  const lastResult = readStringField(record, ['lastResult', 'last_result']);

  return {
    state:
      state === 'lobby' ||
      state === 'in_match' ||
      state === 'waiting_next_round' ||
      state === 'eliminated' ||
      state === 'runner_up' ||
      state === 'champion'
        ? state
        : null,
    currentRound: readNumberField(record, ['currentRound', 'current_round']),
    currentEntryId: readStringField(record, ['currentEntryId', 'current_entry_id']),
    activeMatchId: readStringField(record, ['activeMatchId', 'active_match_id']),
    finalPlacement: readNumberField(record, ['finalPlacement', 'final_placement']),
    lastResult: lastResult === 'win' || lastResult === 'loss' ? lastResult : null,
    canLaunch: record?.canLaunch === true,
  };
};

const normalizeTournamentBots = (value: unknown): PublicTournamentDetail['bots'] => {
  const record = asRecord(value);
  const autoAdd = record?.autoAdd === true;
  const difficultyValue = readStringField(record, ['difficulty']);
  const difficulty: BotDifficulty | null =
    difficultyValue && isBotDifficulty(difficultyValue)
      ? difficultyValue
      : autoAdd
        ? DEFAULT_BOT_DIFFICULTY
        : null;

  return {
    autoAdd,
    difficulty,
    count: Math.max(0, Math.floor(readNumberField(record, ['count']) ?? 0)),
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
    lobbyDeadlineAt: readStringField(record, ['lobbyDeadlineAt', 'lobby_deadline_at']),
    entrants: Math.max(0, Math.floor(readNumberField(record, ['entrants']) ?? 0)),
    maxEntrants: Math.max(0, Math.floor(readNumberField(record, ['maxEntrants', 'max_entrants']) ?? 0)),
    gameMode: readStringField(record, ['gameMode', 'game_mode']) ?? 'standard',
    region: readStringField(record, ['region']) ?? 'Global',
    buyInLabel: readStringField(record, ['buyInLabel', 'buy_in_label']) ?? 'Free',
    prizeLabel: readStringField(record, ['prizeLabel', 'prize_label']) ?? 'No prize listed',
    xpPerMatchWin: Math.max(
      0,
      Math.floor(
        readNumberField(record, [
          'xpPerMatchWin',
          'xp_per_match_win',
          'tournamentMatchWinXp',
          'tournament_match_win_xp',
        ]) ?? 0,
      ),
    ),
    xpForTournamentChampion: Math.max(
      0,
      Math.floor(
        readNumberField(record, [
          'xpForTournamentChampion',
          'xp_for_tournament_champion',
          'tournamentChampionXp',
          'tournament_champion_xp',
        ]) ?? 0,
      ),
    ),
    bots: normalizeTournamentBots(record.bots),
    isLocked: record.isLocked === true,
    currentRound: readNumberField(record, ['currentRound', 'current_round']),
    membership: normalizeMembershipState(record.membership),
    participation: normalizeParticipationState(record.participation),
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
  let session = await ensureSession();
  let client = nakamaService.getClient();

  try {
    const response = await client.rpc(session, rpcName, payload);
    return normalizeRpcPayload(response.payload);
  } catch (error) {
    if (isUnauthorizedTournamentError(error)) {
      try {
        const recoveredSession = await nakamaService.recoverSessionAfterUnauthorized(session);
        if (recoveredSession) {
          session = recoveredSession;
          client = nakamaService.getClient();

          try {
            const retryResponse = await client.rpc(session, rpcName, payload);
            return normalizeRpcPayload(retryResponse.payload);
          } catch (retryError) {
            throw await normalizeTournamentError(retryError);
          }
        }
      } catch (recoveryError) {
        throw await normalizeTournamentError(recoveryError);
      }
    }

    throw await normalizeTournamentError(error);
  }
};

const normalizeLaunchTournamentMatchResponse = (
  payload: RpcPayloadRecord,
  session: Session,
  runId: string,
): TournamentMatchLaunchServiceResult => {
  const statusMetadata = {
    ...(readRecordField(payload, ['statusMetadata', 'status_metadata']) ?? {}),
    ...(readRecordField(payload, ['status', 'status_info', 'statusInfo']) ?? {}),
  };

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
    tournamentRound:
      readNumberField(payload, ['tournamentRound', 'tournament_round', 'round']) ??
      readNumberField(statusMetadata, ['tournamentRound', 'tournament_round', 'round']),
    tournamentEntryId:
      readStringField(payload, ['tournamentEntryId', 'tournament_entry_id', 'entryId', 'entry_id']) ??
      readStringField(statusMetadata, ['tournamentEntryId', 'tournament_entry_id', 'entryId', 'entry_id']),
    playerState:
      readStringField(payload, ['playerState', 'player_state']) ??
      readStringField(statusMetadata, ['playerState', 'player_state']),
    nextRoundReady:
      readBooleanField(payload, ['nextRoundReady', 'next_round_ready']) ??
      readBooleanField(statusMetadata, ['nextRoundReady', 'next_round_ready']),
    statusMessage:
      readStringField(payload, ['statusMessage', 'status_message', 'message']) ??
      readStringField(statusMetadata, ['statusMessage', 'status_message', 'message']),
    queueStatus:
      readStringField(payload, ['queueStatus', 'queue_status']) ??
      readStringField(statusMetadata, ['queueStatus', 'queue_status']),
    statusMetadata,
    session,
    userId: session.user_id,
  };
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

export const getPublicTournamentStatus = async (
  runId: string,
  limit?: number,
): Promise<PublicTournamentStatusSnapshot> => {
  const tournament = await getPublicTournament(runId);
  const standings = await getPublicTournamentStandings(runId, limit);

  return {
    tournament,
    standings,
  };
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
  let session = await ensureSession();
  let client = nakamaService.getClient();

  try {
    const response = await client.rpc(session, RPC_LAUNCH_TOURNAMENT_MATCH, { runId });
    return normalizeLaunchTournamentMatchResponse(normalizeRpcPayload(response.payload), session, runId);
  } catch (error) {
    if (isUnauthorizedTournamentError(error)) {
      try {
        const recoveredSession = await nakamaService.recoverSessionAfterUnauthorized(session);
        if (recoveredSession) {
          session = recoveredSession;
          client = nakamaService.getClient();

          try {
            const retryResponse = await client.rpc(session, RPC_LAUNCH_TOURNAMENT_MATCH, { runId });
            return normalizeLaunchTournamentMatchResponse(normalizeRpcPayload(retryResponse.payload), session, runId);
          } catch (retryError) {
            throw await normalizeTournamentError(retryError);
          }
        }
      } catch (recoveryError) {
        throw await normalizeTournamentError(recoveryError);
      }
    }

    throw await normalizeTournamentError(error);
  }
};

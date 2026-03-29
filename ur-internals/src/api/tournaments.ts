import env from '../config/env'
import { mockTournamentEntriesById, mockTournaments } from '../data/mockData'
import type {
  CreateTournamentInput,
  Tournament,
  TournamentEntry,
  TournamentOperator,
  TournamentStandings,
  TournamentStatus,
} from '../types/tournament'
import {
  AUTO_TOURNAMENT_DURATION_SECONDS,
  getSingleEliminationRoundCount,
} from '../tournamentSizing'
import { callRpc } from './client'
import {
  asRecord,
  readArrayField,
  readBooleanField,
  readNumberField,
  readStringField,
} from './runtime'

const RPC_ADMIN_LIST_TOURNAMENTS = 'rpc_admin_list_tournaments'
const RPC_ADMIN_GET_TOURNAMENT_RUN = 'rpc_admin_get_tournament_run'
const RPC_ADMIN_CREATE_TOURNAMENT_RUN = 'rpc_admin_create_tournament_run'
const RPC_ADMIN_OPEN_TOURNAMENT = 'rpc_admin_open_tournament'
const RPC_ADMIN_FINALIZE_TOURNAMENT = 'rpc_admin_finalize_tournament'
const RPC_ADMIN_DELETE_TOURNAMENT = 'rpc_admin_delete_tournament'
const RPC_ADMIN_GET_TOURNAMENT_STANDINGS = 'rpc_admin_get_tournament_standings'

const DEFAULT_TOURNAMENT_MATCH_WIN_XP = 100
const DEFAULT_TOURNAMENT_CHAMPION_XP = 250

async function wait(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms))
}

function mapTournamentStatus(value: string | null): TournamentStatus {
  if (value === 'open') {
    return 'Open'
  }

  if (value === 'closed') {
    return 'Closed'
  }

  if (value === 'finalized') {
    return 'Finalized'
  }

  return 'Draft'
}

function mapOperator(value: string | null): TournamentOperator {
  if (value === 'best' || value === 'set' || value === 'incr') {
    return value
  }

  return 'incr'
}

function formatPrizePool(metadata: Record<string, unknown>) {
  const explicitPrizePool = readStringField(metadata, ['prizePool', 'prize_pool'])
  if (explicitPrizePool) {
    return explicitPrizePool
  }

  const buyIn = readStringField(metadata, ['buyIn', 'buy_in']) ?? 'Free'
  return buyIn === 'Free' ? 'Not configured' : `${buyIn} buy-in`
}

function toIsoFromUnixSeconds(seconds: number | null, fallback: string | null) {
  if (typeof seconds === 'number' && seconds > 0) {
    return new Date(seconds * 1000).toISOString()
  }

  return fallback
}

function normalizeTournament(runValue: unknown, nakamaTournamentValue: unknown): Tournament {
  const run = asRecord(runValue) ?? {}
  const nakamaTournament = asRecord(nakamaTournamentValue) ?? {}
  const metadata = asRecord(run.metadata) ?? {}

  const id = readStringField(run, ['runId', 'run_id']) ?? readStringField(run, ['id']) ?? 'unknown-run'
  const tournamentId =
    readStringField(run, ['tournamentId', 'tournament_id']) ??
    readStringField(nakamaTournament, ['id']) ??
    id
  const createdAt =
    readStringField(run, ['createdAt', 'created_at']) ?? new Date(0).toISOString()
  const updatedAt =
    readStringField(run, ['updatedAt', 'updated_at']) ?? createdAt
  const startAt = toIsoFromUnixSeconds(
    readNumberField(nakamaTournament, ['startTime', 'start_time']) ??
      readNumberField(run, ['startTime', 'start_time']),
    createdAt,
  )
  const endAt = toIsoFromUnixSeconds(
    readNumberField(nakamaTournament, ['endTime', 'end_time']) ??
      readNumberField(run, ['endTime', 'end_time']),
    null,
  )
  const maxEntrants = Math.max(
    0,
    Math.floor(
      readNumberField(nakamaTournament, ['maxSize', 'max_size']) ??
        readNumberField(run, ['maxSize', 'max_size']) ??
        0,
    ),
  )
  const roundCount = Math.max(
    0,
    Math.floor(
      readNumberField(run, ['maxNumScore', 'max_num_score']) ??
        getSingleEliminationRoundCount(maxEntrants),
    ),
  )

  return {
    id,
    tournamentId,
    name: readStringField(run, ['title', 'name']) ?? id,
    description: readStringField(run, ['description']) ?? 'No description configured.',
    status: mapTournamentStatus(readStringField(run, ['lifecycle'])),
    gameMode: readStringField(metadata, ['gameMode', 'game_mode']) ?? 'standard',
    entrants: Math.max(0, Math.floor(readNumberField(nakamaTournament, ['size']) ?? 0)),
    maxEntrants,
    startAt: startAt ?? createdAt,
    endAt,
    buyIn: readStringField(metadata, ['buyIn', 'buy_in']) ?? 'Free',
    region: readStringField(metadata, ['region']) ?? 'Global',
    prizePool: formatPrizePool(metadata),
    createdBy: readStringField(run, ['createdByLabel', 'created_by_label']) ?? 'Unknown operator',
    createdAt,
    updatedAt,
    category: Math.max(0, Math.floor(readNumberField(run, ['category']) ?? 0)),
    authoritative: readBooleanField(run, ['authoritative']) !== false,
    joinRequired: readBooleanField(run, ['joinRequired', 'join_required']) !== false,
    enableRanks: readBooleanField(run, ['enableRanks', 'enable_ranks']) !== false,
    operator: mapOperator(readStringField(run, ['operator'])),
    roundCount,
    xpPerMatchWin: Math.max(
      0,
      Math.floor(
        readNumberField(metadata, [
          'xpPerMatchWin',
          'xp_per_match_win',
          'matchWinXp',
          'match_win_xp',
          'tournamentMatchWinXp',
          'tournament_match_win_xp',
        ]) ?? DEFAULT_TOURNAMENT_MATCH_WIN_XP,
      ),
    ),
    xpForTournamentChampion: Math.max(
      0,
      Math.floor(
        readNumberField(metadata, [
          'xpForTournamentChampion',
          'xp_for_tournament_champion',
          'championXp',
          'champion_xp',
          'tournamentChampionXp',
          'tournament_champion_xp',
        ]) ?? DEFAULT_TOURNAMENT_CHAMPION_XP,
      ),
    ),
  }
}

function normalizeTournamentFromListItem(value: unknown): Tournament {
  const record = asRecord(value) ?? {}
  return normalizeTournament(record.run ?? record, record.nakamaTournament)
}

function normalizeTournamentEntry(value: unknown): TournamentEntry {
  const record = asRecord(value) ?? {}
  const metadata = asRecord(record.metadata) ?? {}

  return {
    rank: readNumberField(record, ['rank']) ?? null,
    ownerId: readStringField(record, ['ownerId', 'owner_id']) ?? 'unknown-owner',
    username: readStringField(record, ['username']) ?? 'unknown',
    score: readNumberField(record, ['score']) ?? 0,
    subscore: readNumberField(record, ['subscore']) ?? 0,
    attempts: readNumberField(record, ['numScore', 'num_score']) ?? null,
    maxAttempts: readNumberField(record, ['maxNumScore', 'max_num_score']) ?? null,
    matchId: readStringField(metadata, ['matchId', 'match_id']),
    round: readNumberField(metadata, ['round']) ?? null,
    result: readStringField(metadata, ['result']),
    updatedAt:
      readStringField(record, ['updateTime', 'update_time']) ??
      readStringField(record, ['createTime', 'create_time']),
    metadata,
  }
}

export async function listTournaments(limit = 50): Promise<Tournament[]> {
  if (env.useMockData) {
    await wait(180)
    return mockTournaments.map((tournament) => ({ ...tournament }))
  }

  const response = await callRpc<{ runs?: unknown[] }>(RPC_ADMIN_LIST_TOURNAMENTS, {
    limit,
  })

  return readArrayField(response, ['runs']).map((run) => normalizeTournamentFromListItem(run))
}

export async function getTournament(tournamentId: string): Promise<Tournament | null> {
  if (env.useMockData) {
    await wait(180)
    const tournament = mockTournaments.find((entry) => entry.id === tournamentId)
    return tournament ? { ...tournament } : null
  }

  const response = await callRpc<{ run?: unknown; nakamaTournament?: unknown }>(
    RPC_ADMIN_GET_TOURNAMENT_RUN,
    {
      runId: tournamentId,
    },
  )
  const responseRecord = asRecord(response)
  if (!responseRecord?.run) {
    return null
  }

  return normalizeTournament(responseRecord.run, responseRecord.nakamaTournament)
}

export async function getTournamentStandings(
  tournamentId: string,
  limit = 100,
): Promise<TournamentStandings> {
  if (env.useMockData) {
    await wait(180)
    return {
      entries: (mockTournamentEntriesById[tournamentId] ?? []).map((entry) => ({ ...entry })),
      rankCount: mockTournamentEntriesById[tournamentId]?.length ?? 0,
      generatedAt: new Date().toISOString(),
    }
  }

  const response = await callRpc<{ standings?: unknown }>(RPC_ADMIN_GET_TOURNAMENT_STANDINGS, {
    runId: tournamentId,
    limit,
  })
  const standings = asRecord(asRecord(response)?.standings) ?? {}

  return {
    entries: readArrayField(standings, ['records']).map((entry) => normalizeTournamentEntry(entry)),
    rankCount: readNumberField(standings, ['rankCount', 'rank_count']) ?? null,
    generatedAt: readStringField(standings, ['generatedAt', 'generated_at']),
  }
}

export async function createTournament(input: CreateTournamentInput): Promise<Tournament> {
  const roundCount = getSingleEliminationRoundCount(input.entrants)

  if (env.useMockData) {
    await wait(220)

    const slug =
      input.runId?.trim() ||
      input.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    return {
      id: slug || `tournament-${Date.now()}`,
      tournamentId: slug || `tournament-${Date.now()}`,
      name: input.name,
      description: input.description,
      status: 'Draft',
      gameMode: input.gameMode,
      entrants: 0,
      maxEntrants: input.entrants,
      roundCount,
      startAt: input.startAt,
      endAt: null,
      buyIn: 'Free',
      region: 'Global',
      prizePool: 'Not configured',
      createdBy: 'admin@urgame.live',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: 0,
      authoritative: true,
      joinRequired: input.joinRequired,
      enableRanks: input.enableRanks,
      operator: 'incr',
      xpPerMatchWin: input.xpPerMatchWin,
      xpForTournamentChampion: input.xpForTournamentChampion,
    }
  }

  const startTime = Math.floor(new Date(input.startAt).getTime() / 1000)

  const response = await callRpc<{ run?: unknown; nakamaTournament?: unknown }>(
    RPC_ADMIN_CREATE_TOURNAMENT_RUN,
    {
      ...(input.runId?.trim() ? { runId: input.runId.trim() } : {}),
      title: input.name.trim(),
      description: input.description.trim(),
      category: 0,
      authoritative: true,
      sortOrder: 'desc',
      operator: 'incr',
      resetSchedule: '',
      metadata: {
        gameMode: input.gameMode,
        xpPerMatchWin: input.xpPerMatchWin,
        xpForTournamentChampion: input.xpForTournamentChampion,
      },
      startTime,
      maxSize: input.entrants,
      endTime: startTime > 0 ? startTime + AUTO_TOURNAMENT_DURATION_SECONDS : 0,
      duration: AUTO_TOURNAMENT_DURATION_SECONDS,
      maxNumScore: roundCount,
      joinRequired: input.joinRequired,
      enableRanks: input.enableRanks,
    },
  )

  return normalizeTournament(asRecord(response)?.run, asRecord(response)?.nakamaTournament)
}

export async function openTournament(runId: string): Promise<Tournament> {
  if (env.useMockData) {
    await wait(180)
    const tournament = mockTournaments.find((entry) => entry.id === runId)

    if (!tournament) {
      throw new Error(`Tournament run '${runId}' was not found.`)
    }

    return {
      ...tournament,
      status: 'Open',
      updatedAt: new Date().toISOString(),
    }
  }

  const response = await callRpc<{ run?: unknown; nakamaTournament?: unknown }>(
    RPC_ADMIN_OPEN_TOURNAMENT,
    {
      runId,
    },
  )

  return normalizeTournament(asRecord(response)?.run, asRecord(response)?.nakamaTournament)
}

export async function finalizeTournament(runId: string): Promise<Tournament> {
  if (env.useMockData) {
    await wait(180)
    const tournament = mockTournaments.find((entry) => entry.id === runId)

    if (!tournament) {
      throw new Error(`Tournament run '${runId}' was not found.`)
    }

    return {
      ...tournament,
      status: 'Finalized',
      updatedAt: new Date().toISOString(),
    }
  }

  const response = await callRpc<{ run?: unknown; nakamaTournament?: unknown }>(
    RPC_ADMIN_FINALIZE_TOURNAMENT,
    {
      runId,
    },
  )

  return normalizeTournament(asRecord(response)?.run, asRecord(response)?.nakamaTournament)
}

export async function deleteTournament(runId: string): Promise<Tournament> {
  if (env.useMockData) {
    await wait(180)
    const tournamentIndex = mockTournaments.findIndex((entry) => entry.id === runId)

    if (tournamentIndex < 0) {
      throw new Error(`Tournament run '${runId}' was not found.`)
    }

    const [deletedTournament] = mockTournaments.splice(tournamentIndex, 1)
    return {
      ...deletedTournament,
      updatedAt: new Date().toISOString(),
    }
  }

  const response = await callRpc<{ run?: unknown; nakamaTournament?: unknown }>(
    RPC_ADMIN_DELETE_TOURNAMENT,
    {
      runId,
    },
  )

  return normalizeTournament(asRecord(response)?.run, asRecord(response)?.nakamaTournament)
}

import env from '../config/env'
import { mockAuditLog, mockTournamentEntriesById, mockTournaments } from '../data/mockData'
import { buildTournamentExportFallbackBundle } from '../liveOps'
import type { AuditLogEntry } from '../types/audit'
import type {
  CreateTournamentInput,
  Tournament,
  TournamentBracket,
  TournamentBracketEntry,
  TournamentBracketParticipant,
  TournamentExportBundle,
  TournamentEntry,
  TournamentOperator,
  TournamentRegistration,
  TournamentSnapshot,
  TournamentStandings,
  TournamentStatus,
} from '../types/tournament'
import {
  AUTO_TOURNAMENT_DURATION_SECONDS,
  getSingleEliminationRoundCount,
} from '../tournamentSizing'
import { DEFAULT_BOT_DIFFICULTY, isBotDifficulty, type BotDifficulty } from '../types/bot'
import { ApiError, callRpc } from './client'
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
const RPC_ADMIN_EXPORT_TOURNAMENT = 'rpc_admin_export_tournament'

const DEFAULT_TOURNAMENT_MATCH_WIN_XP = 100
const DEFAULT_TOURNAMENT_CHAMPION_XP = 250
const TOURNAMENT_BOT_USER_ID_PREFIX = 'tournament-bot:'

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

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : []
}

function isTournamentBotUserId(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.startsWith(TOURNAMENT_BOT_USER_ID_PREFIX)
}

function normalizeTournamentBots(value: unknown): Tournament['bots'] {
  const record = asRecord(value)
  const autoAdd = record?.autoAdd === true
  const difficultyValue = readStringField(record, ['difficulty'])
  const difficulty: BotDifficulty | null =
    difficultyValue && isBotDifficulty(difficultyValue)
      ? difficultyValue
      : autoAdd
        ? DEFAULT_BOT_DIFFICULTY
        : null

  return {
    autoAdd,
    difficulty,
    count: Math.max(0, Math.floor(readNumberField(record, ['count']) ?? 0)),
  }
}

function normalizeTournamentRegistration(value: unknown): TournamentRegistration | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const userId = readStringField(record, ['userId', 'user_id'])
  const displayName = readStringField(record, ['displayName', 'display_name'])
  const joinedAt = readStringField(record, ['joinedAt', 'joined_at'])
  const seed = readNumberField(record, ['seed'])

  if (!userId || !displayName || !joinedAt || typeof seed !== 'number') {
    return null
  }

  return {
    userId,
    displayName,
    joinedAt,
    seed: Math.max(1, Math.floor(seed)),
  }
}

function normalizeTournamentBracketParticipant(value: unknown): TournamentBracketParticipant | null {
  const record = asRecord(value)
  const registration = normalizeTournamentRegistration(record)
  const updatedAt = readStringField(record, ['updatedAt', 'updated_at'])

  if (!record || !registration || !updatedAt) {
    return null
  }

  const lastResult = readStringField(record, ['lastResult', 'last_result'])

  return {
    ...registration,
    state:
      readStringField(record, ['state']) === 'in_match' ||
      readStringField(record, ['state']) === 'waiting_next_round' ||
      readStringField(record, ['state']) === 'eliminated' ||
      readStringField(record, ['state']) === 'runner_up' ||
      readStringField(record, ['state']) === 'champion'
        ? (readStringField(record, ['state']) as TournamentBracketParticipant['state'])
        : 'lobby',
    currentRound: readNumberField(record, ['currentRound', 'current_round']) ?? null,
    currentEntryId: readStringField(record, ['currentEntryId', 'current_entry_id']),
    activeMatchId: readStringField(record, ['activeMatchId', 'active_match_id']),
    finalPlacement: readNumberField(record, ['finalPlacement', 'final_placement']) ?? null,
    lastResult: lastResult === 'win' || lastResult === 'loss' ? lastResult : null,
    updatedAt,
  }
}

function normalizeTournamentBracketEntry(value: unknown): TournamentBracketEntry | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const entryId = readStringField(record, ['entryId', 'entry_id'])
  const round = readNumberField(record, ['round'])
  const slot = readNumberField(record, ['slot'])
  const createdAt = readStringField(record, ['createdAt', 'created_at'])
  const updatedAt = readStringField(record, ['updatedAt', 'updated_at'])
  const status = readStringField(record, ['status'])

  if (!entryId || typeof round !== 'number' || typeof slot !== 'number' || !createdAt || !updatedAt) {
    return null
  }

  return {
    entryId,
    round: Math.max(1, Math.floor(round)),
    slot: Math.max(1, Math.floor(slot)),
    sourceEntryIds: readStringArray(record.sourceEntryIds),
    playerAUserId: readStringField(record, ['playerAUserId', 'player_a_user_id']),
    playerBUserId: readStringField(record, ['playerBUserId', 'player_b_user_id']),
    playerAUsername: readStringField(record, ['playerAUsername', 'player_a_username']),
    playerBUsername: readStringField(record, ['playerBUsername', 'player_b_username']),
    matchId: readStringField(record, ['matchId', 'match_id']),
    status:
      status === 'ready' || status === 'in_match' || status === 'completed' ? status : 'pending',
    winnerUserId: readStringField(record, ['winnerUserId', 'winner_user_id']),
    loserUserId: readStringField(record, ['loserUserId', 'loser_user_id']),
    playerAScore: readNumberField(record, ['playerAScore', 'player_a_score']) ?? null,
    playerBScore: readNumberField(record, ['playerBScore', 'player_b_score']) ?? null,
    createdAt,
    updatedAt,
    readyAt: readStringField(record, ['readyAt', 'ready_at']),
    startedAt: readStringField(record, ['startedAt', 'started_at']),
    completedAt: readStringField(record, ['completedAt', 'completed_at']),
  }
}

function normalizeTournamentBracket(value: unknown): TournamentBracket | null {
  const record = asRecord(value)
  const format = readStringField(record, ['format'])
  const size = readNumberField(record, ['size'])
  const totalRounds = readNumberField(record, ['totalRounds', 'total_rounds'])
  const startedAt = readStringField(record, ['startedAt', 'started_at'])
  const lockedAt = readStringField(record, ['lockedAt', 'locked_at'])

  if (
    !record ||
    format !== 'single_elimination' ||
    typeof size !== 'number' ||
    typeof totalRounds !== 'number' ||
    !startedAt ||
    !lockedAt
  ) {
    return null
  }

  return {
    format: 'single_elimination',
    size: Math.max(2, Math.floor(size)),
    totalRounds: Math.max(1, Math.floor(totalRounds)),
    startedAt,
    lockedAt,
    finalizedAt: readStringField(record, ['finalizedAt', 'finalized_at']),
    winnerUserId: readStringField(record, ['winnerUserId', 'winner_user_id']),
    runnerUpUserId: readStringField(record, ['runnerUpUserId', 'runner_up_user_id']),
    participants: readArrayField(record, ['participants'])
      .map((entry) => normalizeTournamentBracketParticipant(entry))
      .filter((entry): entry is TournamentBracketParticipant => Boolean(entry)),
    entries: readArrayField(record, ['entries'])
      .map((entry) => normalizeTournamentBracketEntry(entry))
      .filter((entry): entry is TournamentBracketEntry => Boolean(entry)),
  }
}

function normalizeTournamentSnapshot(value: unknown): TournamentSnapshot | null {
  const record = asRecord(value)
  const generatedAt = readStringField(record, ['generatedAt', 'generated_at'])

  if (!record || !generatedAt) {
    return null
  }

  return {
    generatedAt,
    overrideExpiry: Math.max(0, Math.floor(readNumberField(record, ['overrideExpiry', 'override_expiry']) ?? 0)),
    rankCount: readNumberField(record, ['rankCount', 'rank_count']) ?? null,
    records: readArrayField(record, ['records']).map((entry) => asRecord(entry) ?? {}),
    prevCursor: readStringField(record, ['prevCursor', 'prev_cursor']),
    nextCursor: readStringField(record, ['nextCursor', 'next_cursor']),
  }
}

function normalizeTournament(runValue: unknown, nakamaTournamentValue: unknown): Tournament {
  const run = asRecord(runValue) ?? {}
  const nakamaTournament = asRecord(nakamaTournamentValue) ?? {}
  const metadata = asRecord(run.metadata) ?? {}
  const fallbackBotCount = new Set<string>()

  readArrayField(run, ['registrations']).forEach((entry) => {
    const userId = readStringField(entry, ['userId', 'user_id'])
    if (isTournamentBotUserId(userId)) {
      fallbackBotCount.add(userId)
    }
  })

  readArrayField(asRecord(run.bracket), ['participants']).forEach((entry) => {
    const userId = readStringField(entry, ['userId', 'user_id'])
    if (isTournamentBotUserId(userId)) {
      fallbackBotCount.add(userId)
    }
  })

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
    bots:
      run.bots !== undefined
        ? normalizeTournamentBots(run.bots)
        : {
            autoAdd: readBooleanField(metadata, ['autoAddBots', 'auto_add_bots']) === true,
            difficulty: (() => {
              const autoAdd = readBooleanField(metadata, ['autoAddBots', 'auto_add_bots']) === true
              const difficultyValue = readStringField(metadata, ['botDifficulty', 'bot_difficulty'])
              if (difficultyValue && isBotDifficulty(difficultyValue)) {
                return difficultyValue
              }

              return autoAdd ? DEFAULT_BOT_DIFFICULTY : null
            })(),
            count: fallbackBotCount.size,
          },
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
    metadata,
    registrations: readArrayField(run, ['registrations'])
      .map((entry) => normalizeTournamentRegistration(entry))
      .filter((entry): entry is TournamentRegistration => Boolean(entry)),
    bracket: normalizeTournamentBracket(run.bracket),
    finalSnapshot: normalizeTournamentSnapshot(run.finalSnapshot),
    openedAt: readStringField(run, ['openedAt', 'opened_at']),
    closedAt: readStringField(run, ['closedAt', 'closed_at']),
    finalizedAt: readStringField(run, ['finalizedAt', 'finalized_at']),
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
      bots: {
        autoAdd: input.autoAddBots,
        difficulty: input.autoAddBots ? input.botDifficulty ?? DEFAULT_BOT_DIFFICULTY : null,
        count: 0,
      },
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
      metadata: {
        gameMode: input.gameMode,
        xpPerMatchWin: input.xpPerMatchWin,
        xpForTournamentChampion: input.xpForTournamentChampion,
        autoAddBots: input.autoAddBots,
        botDifficulty: input.autoAddBots ? input.botDifficulty ?? DEFAULT_BOT_DIFFICULTY : null,
      },
      registrations: [],
      bracket: null,
      finalSnapshot: null,
      openedAt: null,
      closedAt: null,
      finalizedAt: null,
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
        autoAddBots: input.autoAddBots,
        botDifficulty: input.autoAddBots ? input.botDifficulty ?? DEFAULT_BOT_DIFFICULTY : null,
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

function isMissingExportRpcError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('function not found') ||
    message.includes('rpc function not found') ||
    (error instanceof ApiError && error.status === 404)
  )
}

type ExportTournamentFallbackContext = {
  tournament: Tournament
  standings: TournamentStandings
  auditEntries: AuditLogEntry[]
}

export async function exportTournament(
  runId: string,
  fallback?: ExportTournamentFallbackContext,
): Promise<TournamentExportBundle> {
  if (env.useMockData) {
    await wait(180)
    const tournament = mockTournaments.find((entry) => entry.id === runId)

    if (!tournament) {
      throw new Error(`Tournament run '${runId}' was not found.`)
    }

    if (tournament.status !== 'Finalized') {
      throw new Error('Tournament export is only available after the run is finalized.')
    }

    return buildTournamentExportFallbackBundle(
      tournament,
      {
        entries: (mockTournamentEntriesById[runId] ?? []).map((entry) => ({ ...entry })),
        rankCount: mockTournamentEntriesById[runId]?.length ?? 0,
        generatedAt: new Date().toISOString(),
      },
      mockAuditLog
        .filter((entry) => entry.tournamentId === runId)
        .map((entry) => ({ ...entry, metadata: { ...entry.metadata } })),
    )
  }

  try {
    const response = await callRpc<TournamentExportBundle>(RPC_ADMIN_EXPORT_TOURNAMENT, {
      runId,
    })

    return response
  } catch (error) {
    if (
      fallback &&
      fallback.tournament.status === 'Finalized' &&
      isMissingExportRpcError(error)
    ) {
      return buildTournamentExportFallbackBundle(
        fallback.tournament,
        fallback.standings,
        fallback.auditEntries,
      )
    }

    throw error
  }
}

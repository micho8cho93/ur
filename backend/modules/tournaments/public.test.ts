import {
  rpcGetPublicTournament,
  rpcGetPublicTournamentStandings,
  rpcJoinPublicTournament,
  rpcLaunchTournamentMatch,
  rpcListPublicTournaments,
} from './public';
import { TOURNAMENT_LOBBY_FILL_COUNTDOWN_MS } from '../../../shared/tournamentLobby';
import { completeTournamentBracketMatch } from './bracket';

type StoredObject = {
  collection: string;
  key: string;
  userId?: string;
  value: unknown;
  version: string;
};

type StorageReadRequest = {
  collection: string;
  key: string;
  userId?: string;
};

type StorageWriteRequest = {
  collection: string;
  key: string;
  userId?: string;
  value: unknown;
  version?: string;
};

const TOURNAMENT_VARIANTS = [
  { gameMode: 'gameMode_1_piece', label: 'Pure Luck' },
  { gameMode: 'gameMode_3_pieces', label: 'Race' },
  { gameMode: 'gameMode_finkel_rules', label: 'Finkel Rules' },
  { gameMode: 'gameMode_capture', label: 'Capture' },
  { gameMode: 'gameMode_full_path', label: 'Extended Path' },
  { gameMode: 'standard', label: 'Quick Play' },
] as const;

const buildStorageKey = (collection: string, key: string, userId = ''): string =>
  `${collection}:${key}:${userId}`;

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const createNakama = () => {
  const storage = new Map<string, StoredObject>();
  let versionCounter = 1;
  const entrantCounts = new Map<string, number>();
  const nakamaTournaments = new Map<
    string,
    {
      id: string;
      startTime: number;
      endTime: number;
      maxSize: number;
    }
  >();

  const storageRead = jest.fn((requests: StorageReadRequest[]) =>
    requests
      .map((request) => storage.get(buildStorageKey(request.collection, request.key, request.userId ?? '')))
      .filter((entry): entry is StoredObject => Boolean(entry)),
  );

  const storageWrite = jest.fn((writes: StorageWriteRequest[]) => {
    writes.forEach((write) => {
      const storageKey = buildStorageKey(write.collection, write.key, write.userId ?? '');
      const existing = storage.get(storageKey);
      const version = write.version ?? '';

      if (version === '' && existing) {
        throw new Error(`Storage object already exists for ${storageKey}`);
      }

      if (version !== '' && (!existing || existing.version !== version)) {
        throw new Error(`Storage version mismatch for ${storageKey}`);
      }

      storage.set(storageKey, {
        collection: write.collection,
        key: write.key,
        userId: write.userId,
        value: write.value,
        version: `v${versionCounter++}`,
      });
    });
  });

  const tournamentsGetId = jest.fn((ids: string[]) =>
    ids
      .map((id) => {
        const tournament = nakamaTournaments.get(id);
        if (!tournament) {
          return null;
        }

        return {
          ...tournament,
          size: entrantCounts.get(id) ?? 0,
        };
      })
      .filter(
        (
          entry,
        ): entry is {
          id: string;
          startTime: number;
          endTime: number;
          maxSize: number;
          size: number;
        } => Boolean(entry),
      ),
  );

  return {
    storage,
    entrantCounts,
    nakamaTournaments,
    storageRead,
    storageWrite,
    tournamentsGetId,
    tournamentRanksDisable: jest.fn(),
    tournamentRecordsList: jest.fn(() => ({
      records: [],
      owner_records: [],
      rank_count: 4,
    })),
    tournamentJoin: jest.fn((tournamentId: string) => {
      entrantCounts.set(tournamentId, (entrantCounts.get(tournamentId) ?? 0) + 1);
    }),
    matchCreate: jest.fn(() => 'match-tournament-1'),
  };
};

const seedOpenRun = (
  nk: ReturnType<typeof createNakama>,
  overrides: Partial<{
    runId: string;
    tournamentId: string;
    title: string;
    description: string;
    lifecycle: string;
    entrants: number;
    maxSize: number;
    startTime: number;
    endTime: number;
    metadata: Record<string, unknown>;
  }> = {},
) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const runId = overrides.runId ?? 'run-1';
  const tournamentId = overrides.tournamentId ?? 'tour-1';
  const startTime = overrides.startTime ?? nowSeconds - 3600;
  const endTime = overrides.endTime ?? nowSeconds + 3600;
  const maxSize = overrides.maxSize ?? 16;

  nk.entrantCounts.set(tournamentId, overrides.entrants ?? 4);
  nk.nakamaTournaments.set(tournamentId, {
    id: tournamentId,
    startTime,
    endTime,
    maxSize,
  });

  nk.storage.set(buildStorageKey('tournament_runs', 'index'), {
    collection: 'tournament_runs',
    key: 'index',
    value: {
      runIds: [runId],
      updatedAt: '2026-03-27T09:00:00.000Z',
    },
    version: 'index-v1',
  });

  nk.storage.set(buildStorageKey('tournament_runs', runId), {
    collection: 'tournament_runs',
    key: runId,
    value: {
      runId,
      tournamentId,
      title: overrides.title ?? 'Spring Open',
      description: overrides.description ?? 'A live public run.',
      lifecycle: overrides.lifecycle ?? 'open',
      startTime,
      endTime,
      duration: 7200,
      maxSize,
      maxNumScore: 3,
      joinRequired: true,
      enableRanks: true,
      metadata:
        overrides.metadata ?? {
          gameMode: 'standard',
          region: 'Global',
          buyIn: 'Free',
        },
      createdAt: '2026-03-27T09:00:00.000Z',
      updatedAt: '2026-03-27T09:00:00.000Z',
      createdByUserId: 'admin-1',
      createdByLabel: 'Admin',
    },
    version: 'run-v1',
  });
};

const readStoredRunValue = (
  nk: ReturnType<typeof createNakama>,
  runId = 'run-1',
): Record<string, unknown> => {
  const stored = nk.storage.get(buildStorageKey('tournament_runs', runId));
  if (!stored || typeof stored.value !== 'object' || stored.value === null) {
    throw new Error(`Missing stored run ${runId}`);
  }

  return stored.value as Record<string, unknown>;
};

const writeStoredRunValue = (
  nk: ReturnType<typeof createNakama>,
  value: Record<string, unknown>,
  runId = 'run-1',
) => {
  const storageKey = buildStorageKey('tournament_runs', runId);
  const stored = nk.storage.get(storageKey);
  if (!stored) {
    throw new Error(`Missing stored run ${runId}`);
  }

  nk.storage.set(storageKey, {
    ...stored,
    value,
  });
};

describe('public tournament rpc flow', () => {
  it('locks the bracket once full and resumes the same active match for both players', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 0,
      maxSize: 2,
      metadata: {
        gameMode: 'standard',
        region: 'Global',
        buyIn: 'Free',
        xpPerMatchWin: 180,
        xpForTournamentChampion: 420,
      },
    });

    const listResponse = JSON.parse(
      rpcListPublicTournaments(
        { userId: 'user-1' },
        logger,
        nk,
        JSON.stringify({ limit: 10 }),
      ),
    ) as {
      tournaments: {
        runId: string;
        entrants: number;
        isLocked: boolean;
        currentRound: number | null;
        membership: { isJoined: boolean };
      }[];
    };

    expect(listResponse.tournaments).toEqual([
      expect.objectContaining({
        runId: 'run-1',
        entrants: 0,
        xpPerMatchWin: 180,
        xpForTournamentChampion: 420,
        isLocked: false,
        currentRound: null,
        membership: {
          isJoined: false,
          joinedAt: null,
        },
      }),
    ]);

    const joinResponse = JSON.parse(
      rpcJoinPublicTournament(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      joined: boolean;
      tournament: {
        entrants: number;
        isLocked: boolean;
        currentRound: number | null;
        membership: { isJoined: boolean; joinedAt: string | null };
        participation: { state: string | null; canLaunch: boolean };
      };
    };

    expect(joinResponse.joined).toBe(true);
    expect(joinResponse.tournament.entrants).toBe(1);
    expect(joinResponse.tournament.isLocked).toBe(false);
    expect(joinResponse.tournament.currentRound).toBe(1);
    expect(joinResponse.tournament.membership.isJoined).toBe(true);
    expect(joinResponse.tournament.participation).toEqual(
      expect.objectContaining({
        state: 'lobby',
        canLaunch: false,
      }),
    );
    expect(nk.tournamentJoin).toHaveBeenCalledWith('tour-1', 'user-1', 'RoyalPlayer');

    expect(() =>
      rpcLaunchTournamentMatch(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ).toThrow('This tournament is waiting for the lobby to fill.');

    const guestJoinResponse = JSON.parse(
      rpcJoinPublicTournament(
        { userId: 'user-2', username: 'TempleGuest' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      joined: boolean;
      tournament: {
        entrants: number;
        isLocked: boolean;
        currentRound: number | null;
        membership: { isJoined: boolean; joinedAt: string | null };
        participation: { state: string | null; canLaunch: boolean };
      };
    };

    expect(guestJoinResponse.joined).toBe(true);
    expect(guestJoinResponse.tournament.entrants).toBe(2);
    expect(guestJoinResponse.tournament.isLocked).toBe(true);
    expect(guestJoinResponse.tournament.currentRound).toBe(1);
    expect(guestJoinResponse.tournament.participation).toEqual(
      expect.objectContaining({
        state: 'waiting_next_round',
        canLaunch: true,
      }),
    );

    const hostLaunch = JSON.parse(
      rpcLaunchTournamentMatch(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      matchId: string;
      tournamentRunId: string;
      tournamentId: string;
      queueStatus: string;
      statusMessage: string;
      playerState: string;
      nextRoundReady: boolean;
      tournamentRound: number | null;
      tournamentEntryId: string | null;
    };

    expect(hostLaunch).toEqual(
      expect.objectContaining({
        matchId: 'match-tournament-1',
        tournamentRunId: 'run-1',
        tournamentId: 'tour-1',
        tournamentRound: 1,
        tournamentEntryId: 'round-1-match-1',
        queueStatus: 'active_match',
        statusMessage: 'Tournament match ready.',
        playerState: 'in_match',
        nextRoundReady: true,
      }),
    );

    const guestLaunch = JSON.parse(
      rpcLaunchTournamentMatch(
        { userId: 'user-2', username: 'TempleGuest' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      matchId: string;
      tournamentRunId: string;
      tournamentId: string;
      queueStatus: string;
      statusMessage: string;
      playerState: string;
      nextRoundReady: boolean;
      tournamentRound: number | null;
      tournamentEntryId: string | null;
    };

    expect(guestLaunch).toEqual(
      expect.objectContaining({
        matchId: 'match-tournament-1',
        tournamentRunId: 'run-1',
        tournamentId: 'tour-1',
        tournamentRound: 1,
        tournamentEntryId: 'round-1-match-1',
        queueStatus: 'active_match',
        statusMessage: 'Resuming active tournament match.',
        playerState: 'in_match',
        nextRoundReady: true,
      }),
    );
    expect(nk.matchCreate).toHaveBeenCalledTimes(1);
    expect(nk.matchCreate).toHaveBeenCalledWith(
      'authoritative_match',
      expect.objectContaining({
        tournamentRound: 1,
        tournamentEntryId: 'round-1-match-1',
        tournamentMatchWinXp: 180,
        tournamentChampionXp: 420,
      }),
    );
  });

  it('ignores stale memberships from an older run instance and allows joining the recreated run', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      runId: 'test-tournament',
      tournamentId: 'test-tournament',
      entrants: 0,
      maxSize: 2,
    });

    nk.storage.set(buildStorageKey('tournament_run_memberships', 'test-tournament', 'user-1'), {
      collection: 'tournament_run_memberships',
      key: 'test-tournament',
      userId: 'user-1',
      value: {
        runId: 'test-tournament',
        tournamentId: 'test-tournament',
        userId: 'user-1',
        displayName: 'RoyalPlayer',
        joinedAt: '2026-03-26T09:00:00.000Z',
        updatedAt: '2026-03-26T09:00:00.000Z',
      },
      version: 'membership-v1',
    });

    const detailResponse = JSON.parse(
      rpcGetPublicTournament(
        { userId: 'user-1' },
        logger,
        nk,
        JSON.stringify({ runId: 'test-tournament' }),
      ),
    ) as {
      tournament: {
        membership: { isJoined: boolean; joinedAt: string | null };
        participation: { state: string | null };
      };
    };

    expect(detailResponse.tournament.membership).toEqual({
      isJoined: false,
      joinedAt: null,
    });
    expect(detailResponse.tournament.participation.state).toBeNull();

    const joinResponse = JSON.parse(
      rpcJoinPublicTournament(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'test-tournament' }),
      ),
    ) as {
      joined: boolean;
      tournament: {
        entrants: number;
        membership: { isJoined: boolean; joinedAt: string | null };
        participation: { state: string | null };
      };
    };

    expect(joinResponse.joined).toBe(true);
    expect(joinResponse.tournament.entrants).toBe(1);
    expect(joinResponse.tournament.membership.isJoined).toBe(true);
    expect(joinResponse.tournament.participation.state).toBe('lobby');
    expect(nk.tournamentJoin).toHaveBeenCalledWith('test-tournament', 'user-1', 'RoyalPlayer');

    const storedMembership = nk.storage.get(
      buildStorageKey('tournament_run_memberships', 'test-tournament', 'user-1'),
    )?.value as { joinedAt: string };

    expect(storedMembership.joinedAt).not.toBe('2026-03-26T09:00:00.000Z');
  });

  it('rejects new joins after the bracket has started', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 0,
      maxSize: 2,
    });

    rpcJoinPublicTournament(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-2', username: 'TempleGuest' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );

    expect(() =>
      rpcJoinPublicTournament(
        { userId: 'user-3', username: 'LateGuest' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ).toThrow('This tournament is locked because play has already started.');
  });

  it('rejects match launches for eliminated players', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 0,
      maxSize: 4,
    });

    rpcJoinPublicTournament(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-2', username: 'TempleGuest' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-3', username: 'CourtScribe' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-4', username: 'Archivist' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );

    rpcLaunchTournamentMatch(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );

    const storedRun = readStoredRunValue(nk);
    const completedBracket = completeTournamentBracketMatch(storedRun.bracket as never, {
      entryId: 'round-1-match-1',
      matchId: 'match-tournament-1',
      winnerUserId: 'user-2',
      loserUserId: 'user-1',
      completedAt: '2026-03-27T10:05:00.000Z',
    });

    writeStoredRunValue(nk, {
      ...storedRun,
      updatedAt: '2026-03-27T10:05:00.000Z',
      bracket: completedBracket,
    });

    expect(() =>
      rpcLaunchTournamentMatch(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ).toThrow('Your tournament run has ended.');
  });

  it('keeps semifinal winners waiting for the next round instead of resuming the completed match', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 0,
      maxSize: 4,
    });

    nk.matchCreate
      .mockImplementationOnce(() => 'match-semi-1')
      .mockImplementationOnce(() => 'match-semi-2')
      .mockImplementationOnce(() => 'match-final');

    rpcJoinPublicTournament(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-2', username: 'TempleGuest' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-3', username: 'CourtScribe' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-4', username: 'Archivist' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );

    const firstSemiLaunch = JSON.parse(
      rpcLaunchTournamentMatch(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      matchId: string;
      tournamentEntryId: string | null;
      tournamentRound: number | null;
    };

    const secondSemiLaunch = JSON.parse(
      rpcLaunchTournamentMatch(
        { userId: 'user-3', username: 'CourtScribe' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      matchId: string;
      tournamentEntryId: string | null;
      tournamentRound: number | null;
    };

    expect(firstSemiLaunch).toEqual(
      expect.objectContaining({
        matchId: 'match-semi-1',
        tournamentEntryId: 'round-1-match-1',
        tournamentRound: 1,
      }),
    );
    expect(secondSemiLaunch).toEqual(
      expect.objectContaining({
        matchId: 'match-semi-2',
        tournamentEntryId: 'round-1-match-2',
        tournamentRound: 1,
      }),
    );

    let storedRun = readStoredRunValue(nk);
    const afterFirstSemi = completeTournamentBracketMatch(storedRun.bracket as never, {
      entryId: 'round-1-match-1',
      matchId: 'match-semi-1',
      winnerUserId: 'user-1',
      loserUserId: 'user-2',
      completedAt: '2026-03-27T10:05:00.000Z',
    });

    writeStoredRunValue(nk, {
      ...storedRun,
      updatedAt: '2026-03-27T10:05:00.000Z',
      bracket: afterFirstSemi,
    });

    const winnerWaiting = JSON.parse(
      rpcLaunchTournamentMatch(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      matchId: string | null;
      tournamentEntryId: string | null;
      tournamentRound: number | null;
      playerState: string;
      queueStatus: string;
      statusMessage: string;
    };

    expect(winnerWaiting).toEqual(
      expect.objectContaining({
        matchId: null,
        tournamentEntryId: 'round-2-match-1',
        tournamentRound: 2,
        playerState: 'waiting_next_round',
        queueStatus: 'waiting_next_round',
        statusMessage: 'Waiting for the rest of the bracket to settle.',
      }),
    );

    expect(() =>
      rpcLaunchTournamentMatch(
        { userId: 'user-2', username: 'TempleGuest' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ).toThrow('Your tournament run has ended.');

    storedRun = readStoredRunValue(nk);
    const afterSecondSemi = completeTournamentBracketMatch(storedRun.bracket as never, {
      entryId: 'round-1-match-2',
      matchId: 'match-semi-2',
      winnerUserId: 'user-3',
      loserUserId: 'user-4',
      completedAt: '2026-03-27T10:06:00.000Z',
    });

    writeStoredRunValue(nk, {
      ...storedRun,
      updatedAt: '2026-03-27T10:06:00.000Z',
      bracket: afterSecondSemi,
    });

    const finalLaunch = JSON.parse(
      rpcLaunchTournamentMatch(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      matchId: string;
      tournamentEntryId: string | null;
      tournamentRound: number | null;
      playerState: string;
      queueStatus: string;
      statusMessage: string;
    };

    expect(finalLaunch).toEqual(
      expect.objectContaining({
        matchId: 'match-final',
        tournamentEntryId: 'round-2-match-1',
        tournamentRound: 2,
        playerState: 'in_match',
        queueStatus: 'active_match',
        statusMessage: 'Tournament match ready.',
      }),
    );
    expect(nk.matchCreate).toHaveBeenCalledTimes(3);
  });

  it('ignores stale semifinal active-match ids once the final is ready to launch', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 0,
      maxSize: 4,
    });

    nk.matchCreate
      .mockImplementationOnce(() => 'match-semi-1')
      .mockImplementationOnce(() => 'match-semi-2')
      .mockImplementationOnce(() => 'match-final');

    rpcJoinPublicTournament(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-2', username: 'TempleGuest' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-3', username: 'CourtScribe' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-4', username: 'Archivist' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );

    rpcLaunchTournamentMatch(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcLaunchTournamentMatch(
      { userId: 'user-3', username: 'CourtScribe' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );

    let storedRun = readStoredRunValue(nk);
    const afterFirstSemi = completeTournamentBracketMatch(storedRun.bracket as never, {
      entryId: 'round-1-match-1',
      matchId: 'match-semi-1',
      winnerUserId: 'user-1',
      loserUserId: 'user-2',
      completedAt: '2026-03-27T10:05:00.000Z',
    });

    writeStoredRunValue(nk, {
      ...storedRun,
      updatedAt: '2026-03-27T10:05:00.000Z',
      bracket: afterFirstSemi,
    });

    storedRun = readStoredRunValue(nk);
    const afterSecondSemi = completeTournamentBracketMatch(storedRun.bracket as never, {
      entryId: 'round-1-match-2',
      matchId: 'match-semi-2',
      winnerUserId: 'user-3',
      loserUserId: 'user-4',
      completedAt: '2026-03-27T10:06:00.000Z',
    });
    const staleFinalBracket = {
      ...afterSecondSemi,
      participants: afterSecondSemi.participants.map((participant) =>
        participant.userId === 'user-1'
          ? {
              ...participant,
              state: 'in_match',
              activeMatchId: 'match-semi-1',
            }
          : participant,
      ),
    };

    writeStoredRunValue(nk, {
      ...storedRun,
      updatedAt: '2026-03-27T10:06:00.000Z',
      bracket: staleFinalBracket,
    });

    const detailResponse = JSON.parse(
      rpcGetPublicTournament(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      tournament: {
        participation: {
          state: string | null;
          currentRound: number | null;
          currentEntryId: string | null;
          activeMatchId: string | null;
          canLaunch: boolean;
        };
      };
    };

    expect(detailResponse.tournament.participation).toEqual(
      expect.objectContaining({
        state: 'waiting_next_round',
        currentRound: 2,
        currentEntryId: 'round-2-match-1',
        activeMatchId: null,
        canLaunch: true,
      }),
    );

    const finalLaunch = JSON.parse(
      rpcLaunchTournamentMatch(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      matchId: string | null;
      tournamentEntryId: string | null;
      tournamentRound: number | null;
      playerState: string;
      queueStatus: string;
    };

    expect(finalLaunch).toEqual(
      expect.objectContaining({
        matchId: 'match-final',
        tournamentEntryId: 'round-2-match-1',
        tournamentRound: 2,
        playerState: 'in_match',
        queueStatus: 'active_match',
      }),
    );
  });

  it('does not resume a completed prior-round entry while the rest of the bracket settles', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 0,
      maxSize: 4,
    });

    nk.matchCreate
      .mockImplementationOnce(() => 'match-semi-1')
      .mockImplementationOnce(() => 'match-semi-2');

    rpcJoinPublicTournament(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-2', username: 'TempleGuest' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-3', username: 'CourtScribe' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-4', username: 'Archivist' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );

    rpcLaunchTournamentMatch(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcLaunchTournamentMatch(
      { userId: 'user-3', username: 'CourtScribe' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );

    const storedRun = readStoredRunValue(nk);
    const afterFirstSemi = completeTournamentBracketMatch(storedRun.bracket as never, {
      entryId: 'round-1-match-1',
      matchId: 'match-semi-1',
      winnerUserId: 'user-1',
      loserUserId: 'user-2',
      completedAt: '2026-03-27T10:05:00.000Z',
    });
    const staleWinnerBracket = {
      ...afterFirstSemi,
      participants: afterFirstSemi.participants.map((participant) =>
        participant.userId === 'user-1'
          ? {
              ...participant,
              currentRound: 1,
              currentEntryId: 'round-1-match-1',
            }
          : participant,
      ),
    };

    writeStoredRunValue(nk, {
      ...storedRun,
      updatedAt: '2026-03-27T10:05:00.000Z',
      bracket: staleWinnerBracket,
    });

    const waitingLaunch = JSON.parse(
      rpcLaunchTournamentMatch(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      matchId: string | null;
      tournamentEntryId: string | null;
      tournamentRound: number | null;
      playerState: string;
      queueStatus: string;
      statusMessage: string;
    };

    expect(waitingLaunch).toEqual(
      expect.objectContaining({
        matchId: null,
        tournamentEntryId: 'round-1-match-1',
        tournamentRound: 1,
        playerState: 'waiting_next_round',
        queueStatus: 'waiting_next_round',
        statusMessage: 'Waiting for the rest of the bracket to settle.',
      }),
    );
  });

  it('keeps finalized tournament status readable for joined players while hiding it from the public list', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 0,
      maxSize: 2,
    });

    rpcJoinPublicTournament(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-2', username: 'TempleGuest' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcLaunchTournamentMatch(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );

    const storedRun = readStoredRunValue(nk);
    const finalizedBracket = completeTournamentBracketMatch(storedRun.bracket as never, {
      entryId: 'round-1-match-1',
      matchId: 'match-tournament-1',
      winnerUserId: 'user-1',
      loserUserId: 'user-2',
      completedAt: '2026-03-27T10:05:00.000Z',
    });

    writeStoredRunValue(nk, {
      ...storedRun,
      lifecycle: 'finalized',
      updatedAt: '2026-03-27T10:05:00.000Z',
      closedAt: '2026-03-27T10:05:00.000Z',
      finalizedAt: '2026-03-27T10:05:00.000Z',
      bracket: finalizedBracket,
      finalSnapshot: {
        generatedAt: '2026-03-27T10:05:00.000Z',
        overrideExpiry: 0,
        rankCount: 2,
        records: [
          {
            rank: 1,
            owner_id: 'user-1',
            username: 'RoyalPlayer',
            score: 1,
            metadata: {
              result: 'win',
              round: 1,
              matchId: 'match-tournament-1',
            },
          },
          {
            rank: 2,
            owner_id: 'user-2',
            username: 'TempleGuest',
            score: 0,
            metadata: {
              result: 'loss',
              round: 1,
              matchId: 'match-tournament-1',
            },
          },
        ],
        prevCursor: null,
        nextCursor: null,
      },
    });

    const detailResponse = JSON.parse(
      rpcGetPublicTournament(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      tournament: {
        lifecycle: string;
        participation: { state: string | null; finalPlacement: number | null };
      };
    };

    const standingsResponse = JSON.parse(
      rpcGetPublicTournamentStandings(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1', limit: 10 }),
      ),
    ) as {
      standings: {
        records: Array<{ rank: number; owner_id: string; metadata: { result: string } }>;
      };
    };

    const listResponse = JSON.parse(
      rpcListPublicTournaments(
        { userId: 'user-1' },
        logger,
        nk,
        JSON.stringify({ limit: 10 }),
      ),
    ) as {
      tournaments: Array<{ runId: string }>;
    };

    expect(detailResponse.tournament.lifecycle).toBe('finalized');
    expect(detailResponse.tournament.participation).toEqual(
      expect.objectContaining({
        state: 'champion',
        finalPlacement: 1,
      }),
    );
    expect(standingsResponse.standings.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rank: 1,
          owner_id: 'user-1',
          metadata: expect.objectContaining({
            result: 'win',
          }),
        }),
      ]),
    );
    expect(listResponse.tournaments).toEqual([]);
  });

  it('auto-finalizes an opened lobby that misses the three-minute fill countdown', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 1,
      maxSize: 4,
    });

    const openedAt = new Date(Date.now() - TOURNAMENT_LOBBY_FILL_COUNTDOWN_MS - 5_000).toISOString();
    const storedRun = readStoredRunValue(nk);

    writeStoredRunValue(nk, {
      ...storedRun,
      updatedAt: openedAt,
      openedAt,
      registrations: [
        {
          userId: 'user-1',
          displayName: 'RoyalPlayer',
          joinedAt: openedAt,
          seed: 1,
        },
      ],
    });

    nk.storage.set(buildStorageKey('tournament_run_memberships', 'run-1', 'user-1'), {
      collection: 'tournament_run_memberships',
      key: 'run-1',
      userId: 'user-1',
      value: {
        runId: 'run-1',
        tournamentId: 'tour-1',
        userId: 'user-1',
        displayName: 'RoyalPlayer',
        joinedAt: openedAt,
        updatedAt: openedAt,
      },
      version: 'membership-v1',
    });

    const detailResponse = JSON.parse(
      rpcGetPublicTournament(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      tournament: {
        lifecycle: string;
        lobbyDeadlineAt: string | null;
        membership: { isJoined: boolean };
      };
    };

    const listResponse = JSON.parse(
      rpcListPublicTournaments(
        { userId: 'user-2' },
        logger,
        nk,
        JSON.stringify({ limit: 10 }),
      ),
    ) as {
      tournaments: Array<{ runId: string }>;
    };

    const updatedRun = readStoredRunValue(nk);

    expect(detailResponse.tournament).toEqual(
      expect.objectContaining({
        lifecycle: 'finalized',
        lobbyDeadlineAt: new Date(Date.parse(openedAt) + TOURNAMENT_LOBBY_FILL_COUNTDOWN_MS).toISOString(),
        membership: expect.objectContaining({
          isJoined: true,
        }),
      }),
    );
    expect(listResponse.tournaments).toEqual([]);
    expect(updatedRun.lifecycle).toBe('finalized');
    expect(updatedRun.finalizedAt).toEqual(expect.any(String));
    expect(nk.tournamentRanksDisable).toHaveBeenCalledWith('tour-1');
  });

  it('fills missing lobby seats with bots after timeout, locks the bracket, and blocks late joins', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 1,
      maxSize: 4,
      metadata: {
        gameMode: 'standard',
        region: 'Global',
        buyIn: 'Free',
        autoAddBots: true,
        botDifficulty: 'hard',
      },
    });

    const openedAt = new Date(Date.now() - TOURNAMENT_LOBBY_FILL_COUNTDOWN_MS - 5_000).toISOString();
    const storedRun = readStoredRunValue(nk);

    writeStoredRunValue(nk, {
      ...storedRun,
      updatedAt: openedAt,
      openedAt,
      registrations: [
        {
          userId: 'user-1',
          displayName: 'RoyalPlayer',
          joinedAt: openedAt,
          seed: 1,
        },
      ],
    });

    nk.storage.set(buildStorageKey('tournament_run_memberships', 'run-1', 'user-1'), {
      collection: 'tournament_run_memberships',
      key: 'run-1',
      userId: 'user-1',
      value: {
        runId: 'run-1',
        tournamentId: 'tour-1',
        userId: 'user-1',
        displayName: 'RoyalPlayer',
        joinedAt: openedAt,
        updatedAt: openedAt,
      },
      version: 'membership-v1',
    });

    const detailResponse = JSON.parse(
      rpcGetPublicTournament(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      tournament: {
        lifecycle: string;
        isLocked: boolean;
        bots: { autoAdd: boolean; difficulty: string | null; count: number };
        participation: { canLaunch: boolean; currentEntryId: string | null };
      };
    };

    const updatedRun = readStoredRunValue(nk);
    const botRegistrations = ((updatedRun.registrations as Array<Record<string, unknown>> | undefined) ?? []).filter(
      (registration) => typeof registration.userId === 'string' && registration.userId.startsWith('tournament-bot:'),
    );

    expect(detailResponse.tournament).toEqual(
      expect.objectContaining({
        lifecycle: 'open',
        isLocked: true,
        bots: {
          autoAdd: true,
          difficulty: 'hard',
          count: 3,
        },
        participation: expect.objectContaining({
          canLaunch: true,
          currentEntryId: 'round-1-match-1',
        }),
      }),
    );
    expect(updatedRun.bracket).toEqual(expect.objectContaining({ size: 4 }));
    expect(botRegistrations).toHaveLength(3);
    expect(nk.tournamentJoin).toHaveBeenCalledTimes(3);
    expect(() =>
      rpcJoinPublicTournament(
        { userId: 'late-user', username: 'LateArrival' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ).toThrow('This tournament is locked because play has already started.');
  });

  it('finalizes a timed-out bot-fill lobby when zero humans joined', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 0,
      maxSize: 4,
      metadata: {
        gameMode: 'standard',
        region: 'Global',
        buyIn: 'Free',
        autoAddBots: true,
        botDifficulty: 'medium',
      },
    });

    const openedAt = new Date(Date.now() - TOURNAMENT_LOBBY_FILL_COUNTDOWN_MS - 5_000).toISOString();
    const storedRun = readStoredRunValue(nk);

    writeStoredRunValue(nk, {
      ...storedRun,
      updatedAt: openedAt,
      openedAt,
      registrations: [],
    });

    const response = JSON.parse(
      rpcListPublicTournaments(
        { userId: 'user-1' },
        logger,
        nk,
        JSON.stringify({ limit: 10 }),
      ),
    ) as {
      tournaments: Array<{ runId: string }>;
    };

    const updatedRun = readStoredRunValue(nk);

    expect(response.tournaments).toEqual([]);
    expect(updatedRun.lifecycle).toBe('finalized');
    expect(updatedRun.bracket ?? null).toBeNull();
    expect(nk.tournamentJoin).not.toHaveBeenCalled();
  });

  it('launches human-vs-bot tournament matches with explicit bot params', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 1,
      maxSize: 4,
      metadata: {
        gameMode: 'standard',
        region: 'Global',
        buyIn: 'Free',
        xpPerMatchWin: 180,
        xpForTournamentChampion: 420,
        autoAddBots: true,
        botDifficulty: 'hard',
      },
    });

    const openedAt = new Date(Date.now() - TOURNAMENT_LOBBY_FILL_COUNTDOWN_MS - 5_000).toISOString();
    const storedRun = readStoredRunValue(nk);

    writeStoredRunValue(nk, {
      ...storedRun,
      updatedAt: openedAt,
      openedAt,
      registrations: [
        {
          userId: 'user-1',
          displayName: 'RoyalPlayer',
          joinedAt: openedAt,
          seed: 1,
        },
      ],
    });

    nk.storage.set(buildStorageKey('tournament_run_memberships', 'run-1', 'user-1'), {
      collection: 'tournament_run_memberships',
      key: 'run-1',
      userId: 'user-1',
      value: {
        runId: 'run-1',
        tournamentId: 'tour-1',
        userId: 'user-1',
        displayName: 'RoyalPlayer',
        joinedAt: openedAt,
        updatedAt: openedAt,
      },
      version: 'membership-v1',
    });

    const launchResponse = JSON.parse(
      rpcLaunchTournamentMatch(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      matchId: string;
      queueStatus: string;
    };

    expect(launchResponse).toEqual(
      expect.objectContaining({
        matchId: 'match-tournament-1',
        queueStatus: 'active_match',
      }),
    );
    expect(nk.matchCreate).toHaveBeenCalledWith(
      'authoritative_match',
      expect.objectContaining({
        playerIds: ['user-1', 'tournament-bot:run-1:2'],
        botMatch: true,
        botDifficulty: 'hard',
        botUserId: 'tournament-bot:run-1:2',
        botDisplayName: 'Hard Bot 1',
        tournamentMatchWinXp: 180,
        tournamentChampionXp: 420,
      }),
    );
  });

  it('auto-finalizes a completed bracket when public tournament status is refreshed', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 0,
      maxSize: 2,
    });

    rpcJoinPublicTournament(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-2', username: 'TempleGuest' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcLaunchTournamentMatch(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );

    const storedRun = readStoredRunValue(nk);
    const finalizedBracket = completeTournamentBracketMatch(storedRun.bracket as never, {
      entryId: 'round-1-match-1',
      matchId: 'match-tournament-1',
      winnerUserId: 'user-1',
      loserUserId: 'user-2',
      completedAt: '2026-03-27T10:05:00.000Z',
    });

    writeStoredRunValue(nk, {
      ...storedRun,
      updatedAt: '2026-03-27T10:05:00.000Z',
      bracket: finalizedBracket,
    });
    nk.tournamentRecordsList.mockReturnValue({
      records: [
        {
          rank: 1,
          owner_id: 'user-1',
          username: 'RoyalPlayer',
          score: 1,
          metadata: {
            result: 'win',
            round: 1,
            matchId: 'match-tournament-1',
          },
        },
        {
          rank: 2,
          owner_id: 'user-2',
          username: 'TempleGuest',
          score: 0,
          metadata: {
            result: 'loss',
            round: 1,
            matchId: 'match-tournament-1',
          },
        },
      ],
      owner_records: [],
      rank_count: 2,
    });

    const response = JSON.parse(
      rpcGetPublicTournament(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      tournament: {
        lifecycle: string;
        participation: { state: string | null; finalPlacement: number | null };
      };
    };

    const updatedRun = readStoredRunValue(nk);

    expect(response.tournament.lifecycle).toBe('finalized');
    expect(response.tournament.participation).toEqual(
      expect.objectContaining({
        state: 'champion',
        finalPlacement: 1,
      }),
    );
    expect(updatedRun.lifecycle).toBe('finalized');
    expect(updatedRun.finalizedAt).toEqual(expect.any(String));
    expect(nk.tournamentRanksDisable).toHaveBeenCalledWith('tour-1');
  });

  it.each(TOURNAMENT_VARIANTS)(
    'blocks stale final-match resumes for $label tournaments once standings prove the tournament is complete',
    ({ gameMode }) => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 0,
      maxSize: 2,
      metadata: {
        gameMode,
        region: 'Global',
        buyIn: 'Free',
      },
    });

    rpcJoinPublicTournament(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-2', username: 'TempleGuest' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcLaunchTournamentMatch(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );

    const storedRun = readStoredRunValue(nk);
    writeStoredRunValue(nk, {
      ...storedRun,
      updatedAt: '2026-03-27T10:05:00.000Z',
      metadata: {
        ...(typeof storedRun.metadata === 'object' && storedRun.metadata !== null ? storedRun.metadata : {}),
        countedMatchCount: 1,
        countedResultIds: ['run-1:match-tournament-1'],
        lastProcessedMatchId: 'match-tournament-1',
        lastProcessedResultId: 'run-1:match-tournament-1',
        lastProcessedWasCounted: true,
        lastWinnerUserId: 'user-1',
      },
    });
    nk.tournamentRecordsList.mockReturnValue({
      records: [
        {
          rank: 1,
          owner_id: 'user-1',
          username: 'RoyalPlayer',
          score: 1,
          metadata: {
            result: 'win',
            round: 1,
            matchId: 'match-tournament-1',
          },
        },
        {
          rank: 2,
          owner_id: 'user-2',
          username: 'TempleGuest',
          score: 0,
          metadata: {
            result: 'loss',
            round: 1,
            matchId: 'match-tournament-1',
          },
        },
      ],
      owner_records: [],
      rank_count: 2,
    });

    const resumeResponse = JSON.parse(
      rpcLaunchTournamentMatch(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      matchId: string | null;
      queueStatus: string;
      statusMessage: string;
      playerState: string;
    };

    const detailResponse = JSON.parse(
      rpcGetPublicTournament(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      tournament: {
        lifecycle: string;
        participation: { state: string | null; finalPlacement: number | null; activeMatchId: string | null };
      };
    };

    const listResponse = JSON.parse(
      rpcListPublicTournaments(
        { userId: 'user-1' },
        logger,
        nk,
        JSON.stringify({ limit: 10 }),
      ),
    ) as {
      tournaments: Array<{ runId: string }>;
    };

    const updatedRun = readStoredRunValue(nk);

    expect(resumeResponse).toEqual(
      expect.objectContaining({
        matchId: null,
        queueStatus: 'finalized',
        statusMessage: 'Tournament complete.',
        playerState: 'champion',
      }),
    );
    expect(detailResponse.tournament.lifecycle).toBe('finalized');
    expect(detailResponse.tournament.participation).toEqual(
      expect.objectContaining({
        state: 'champion',
        finalPlacement: 1,
        activeMatchId: null,
      }),
    );
    expect(listResponse.tournaments).toEqual([]);
    expect(updatedRun.lifecycle).toBe('finalized');
    },
  );

  it('returns champion and runner-up participation from finalized bracket data even when participant state is stale', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk, {
      entrants: 0,
      maxSize: 2,
    });

    rpcJoinPublicTournament(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcJoinPublicTournament(
      { userId: 'user-2', username: 'TempleGuest' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    rpcLaunchTournamentMatch(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );

    const storedRun = readStoredRunValue(nk);
    const finalizedBracket = completeTournamentBracketMatch(storedRun.bracket as never, {
      entryId: 'round-1-match-1',
      matchId: 'match-tournament-1',
      winnerUserId: 'user-1',
      loserUserId: 'user-2',
      completedAt: '2026-03-27T10:05:00.000Z',
    });
    const staleFinalizedBracket = {
      ...finalizedBracket,
      participants: finalizedBracket.participants.map((participant) => {
        if (participant.userId === 'user-1') {
          return {
            ...participant,
            state: 'waiting_next_round',
            finalPlacement: null,
            activeMatchId: 'match-tournament-1',
          };
        }

        if (participant.userId === 'user-2') {
          return {
            ...participant,
            state: 'eliminated',
            finalPlacement: null,
            activeMatchId: 'match-tournament-1',
          };
        }

        return participant;
      }),
    };

    writeStoredRunValue(nk, {
      ...storedRun,
      updatedAt: '2026-03-27T10:05:00.000Z',
      bracket: staleFinalizedBracket,
    });
    nk.tournamentRecordsList.mockReturnValue({
      records: [
        {
          rank: 1,
          owner_id: 'user-1',
          username: 'RoyalPlayer',
          score: 1,
          metadata: {
            result: 'win',
            round: 1,
            matchId: 'match-tournament-1',
          },
        },
        {
          rank: 2,
          owner_id: 'user-2',
          username: 'TempleGuest',
          score: 0,
          metadata: {
            result: 'loss',
            round: 1,
            matchId: 'match-tournament-1',
          },
        },
      ],
      owner_records: [],
      rank_count: 2,
    });

    const championResponse = JSON.parse(
      rpcGetPublicTournament(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      tournament: {
        lifecycle: string;
        participation: { state: string | null; finalPlacement: number | null; canLaunch: boolean };
      };
    };
    const runnerUpResponse = JSON.parse(
      rpcGetPublicTournament(
        { userId: 'user-2', username: 'TempleGuest' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      tournament: {
        lifecycle: string;
        participation: { state: string | null; finalPlacement: number | null; canLaunch: boolean };
      };
    };

    expect(championResponse.tournament.lifecycle).toBe('finalized');
    expect(championResponse.tournament.participation).toEqual(
      expect.objectContaining({
        state: 'champion',
        finalPlacement: 1,
        canLaunch: false,
      }),
    );
    expect(runnerUpResponse.tournament.participation).toEqual(
      expect.objectContaining({
        state: 'runner_up',
        finalPlacement: 2,
        canLaunch: false,
      }),
    );
  });

  it('hides expired runs from the public list and rejects new joins', () => {
    const nk = createNakama();
    const logger = createLogger();
    const nowSeconds = Math.floor(Date.now() / 1000);

    seedOpenRun(nk, {
      runId: 'expired-run',
      tournamentId: 'tour-expired',
      title: 'Expired Run',
      startTime: nowSeconds - 7200,
      endTime: nowSeconds - 60,
    });

    const listResponse = JSON.parse(
      rpcListPublicTournaments(
        { userId: 'user-1' },
        logger,
        nk,
        JSON.stringify({ limit: 10 }),
      ),
    ) as {
      tournaments: { runId: string }[];
      totalCount: number;
    };

    expect(listResponse).toEqual({
      tournaments: [],
      totalCount: 0,
      ok: true,
    });

    expect(() =>
      rpcJoinPublicTournament(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'expired-run' }),
      ),
    ).toThrow('This tournament is not available in public play.');
  });

  it('starts immediately once the lobby is full even if the scheduled start time is later', () => {
    const nk = createNakama();
    const logger = createLogger();
    const nowSeconds = Math.floor(Date.now() / 1000);

    seedOpenRun(nk, {
      entrants: 0,
      maxSize: 2,
      startTime: nowSeconds + 900,
      endTime: nowSeconds + 3600,
    });

    rpcJoinPublicTournament(
      { userId: 'user-1', username: 'RoyalPlayer' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );

    const joinResponse = JSON.parse(
      rpcJoinPublicTournament(
        { userId: 'user-2', username: 'TempleGuest' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      tournament: {
        entrants: number;
        isLocked: boolean;
        participation: { state: string | null; canLaunch: boolean };
      };
    };

    expect(joinResponse.tournament.entrants).toBe(2);
    expect(joinResponse.tournament.isLocked).toBe(true);
    expect(joinResponse.tournament.participation).toEqual(
      expect.objectContaining({
        state: 'waiting_next_round',
        canLaunch: true,
      }),
    );

    const launchResponse = JSON.parse(
      rpcLaunchTournamentMatch(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as {
      matchId: string;
      queueStatus: string;
      playerState: string;
      tournamentRound: number | null;
    };

    expect(launchResponse).toEqual(
      expect.objectContaining({
        matchId: 'match-tournament-1',
        queueStatus: 'active_match',
        playerState: 'in_match',
        tournamentRound: 1,
      }),
    );
  });
});

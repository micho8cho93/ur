import {
  rpcJoinPublicTournament,
  rpcLaunchTournamentMatch,
  rpcListPublicTournaments,
} from './public';
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

  it('still respects the scheduled start time after the lobby is full', () => {
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
    expect(joinResponse.tournament.isLocked).toBe(false);
    expect(joinResponse.tournament.participation).toEqual(
      expect.objectContaining({
        state: 'lobby',
        canLaunch: false,
      }),
    );

    expect(() =>
      rpcLaunchTournamentMatch(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ).toThrow('This tournament has not started yet.');
  });
});

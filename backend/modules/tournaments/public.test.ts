import {
  rpcJoinPublicTournament,
  rpcLaunchTournamentMatch,
  rpcListPublicTournaments,
} from './public';

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
      metadata: {
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

describe('public tournament rpc flow', () => {
  it('lists public runs and supports joining plus queue-based launch', () => {
    const nk = createNakama();
    const logger = createLogger();
    seedOpenRun(nk);

    const listResponse = JSON.parse(
      rpcListPublicTournaments(
        { userId: 'user-1' },
        logger,
        nk,
        JSON.stringify({ limit: 10 }),
      ),
    ) as {
      tournaments: Array<{
        runId: string;
        entrants: number;
        membership: { isJoined: boolean };
      }>;
    };

    expect(listResponse.tournaments).toEqual([
      expect.objectContaining({
        runId: 'run-1',
        entrants: 4,
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
        membership: { isJoined: boolean; joinedAt: string | null };
      };
    };

    expect(joinResponse.joined).toBe(true);
    expect(joinResponse.tournament.entrants).toBe(5);
    expect(joinResponse.tournament.membership.isJoined).toBe(true);
    expect(nk.tournamentJoin).toHaveBeenCalledWith('tour-1', 'user-1', 'RoyalPlayer');

    const hostLaunch = JSON.parse(
      rpcLaunchTournamentMatch(
        { userId: 'user-1', username: 'RoyalPlayer' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as { matchId: string; tournamentRunId: string; tournamentId: string };

    expect(hostLaunch).toEqual(
      expect.objectContaining({
        matchId: 'match-tournament-1',
        tournamentRunId: 'run-1',
        tournamentId: 'tour-1',
      }),
    );

    rpcJoinPublicTournament(
      { userId: 'user-2', username: 'TempleGuest' },
      logger,
      nk,
      JSON.stringify({ runId: 'run-1' }),
    );
    const guestLaunch = JSON.parse(
      rpcLaunchTournamentMatch(
        { userId: 'user-2', username: 'TempleGuest' },
        logger,
        nk,
        JSON.stringify({ runId: 'run-1' }),
      ),
    ) as { matchId: string; tournamentRunId: string; tournamentId: string };

    expect(guestLaunch).toEqual(
      expect.objectContaining({
        matchId: 'match-tournament-1',
        tournamentRunId: 'run-1',
        tournamentId: 'tour-1',
      }),
    );
    expect(nk.matchCreate).toHaveBeenCalledTimes(1);
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
      tournaments: Array<{ runId: string }>;
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
});

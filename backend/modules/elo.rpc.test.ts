import {
  ensureEloLeaderboard,
  processRankedMatchResult,
  rpcGetEloLeaderboardAroundMe,
  rpcGetMyRatingProfile,
  rpcListTopEloPlayers,
} from './elo';

type StoredObject = {
  collection: string;
  key: string;
  userId: string;
  version: string;
  value: unknown;
};

type LeaderboardRecordValue = {
  ownerId: string;
  username: string;
  score: number;
  subscore: number;
  metadata: Record<string, unknown>;
  createTime: string;
  updateTime: string;
};

type LeaderboardState = {
  authoritative: boolean;
  sortOrder: 'asc' | 'desc';
  records: Map<string, LeaderboardRecordValue>;
};

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const makeStorageKey = (collection: string, key: string, userId = ''): string => `${collection}:${key}:${userId}`;

const createRuntime = () => {
  const storage = new Map<string, StoredObject>();
  const leaderboards = new Map<string, LeaderboardState>();
  let versionCounter = 0;

  const nextVersion = () => {
    versionCounter += 1;
    return `version-${versionCounter}`;
  };

  const getLeaderboardState = (leaderboardId: string): LeaderboardState => {
    const existing = leaderboards.get(leaderboardId);
    if (existing) {
      return existing;
    }

    const created: LeaderboardState = {
      authoritative: true,
      sortOrder: 'desc',
      records: new Map<string, LeaderboardRecordValue>(),
    };
    leaderboards.set(leaderboardId, created);
    return created;
  };

  const buildRankedRecords = (leaderboardId: string) => {
    const leaderboard = getLeaderboardState(leaderboardId);
    return [...leaderboard.records.values()].sort((left, right) => {
      if (leaderboard.sortOrder === 'asc') {
        if (left.score !== right.score) {
          return left.score - right.score;
        }
        if (left.subscore !== right.subscore) {
          return left.subscore - right.subscore;
        }
      } else {
        if (left.score !== right.score) {
          return right.score - left.score;
        }
        if (left.subscore !== right.subscore) {
          return right.subscore - left.subscore;
        }
      }

      return left.ownerId.localeCompare(right.ownerId);
    });
  };

  const buildLeaderboardRecord = (leaderboardId: string, record: LeaderboardRecordValue) => {
    const ranked = buildRankedRecords(leaderboardId);
    const rank = ranked.findIndex((entry) => entry.ownerId === record.ownerId) + 1;

    return {
      ownerId: record.ownerId,
      owner_id: record.ownerId,
      username: record.username,
      score: record.score,
      subscore: record.subscore,
      metadata: record.metadata,
      rank,
    };
  };

  const nk = {
    storageRead: jest.fn((requests: { collection: string; key: string; userId?: string }[]) =>
      requests
        .map((request) => storage.get(makeStorageKey(request.collection, request.key, request.userId ?? '')))
        .filter(Boolean),
    ),
    storageWrite: jest.fn(
      (
        writes: {
          collection: string;
          key: string;
          userId?: string;
          value: unknown;
          version?: string;
        }[],
      ) => {
        writes.forEach((write) => {
          const userId = write.userId ?? '';
          const storageKey = makeStorageKey(write.collection, write.key, userId);
          const existing = storage.get(storageKey);
          const requestedVersion = write.version ?? '';

          if (requestedVersion === '*') {
            if (existing) {
              throw new Error(`Storage object already exists for ${storageKey}`);
            }
          } else if (requestedVersion && (!existing || existing.version !== requestedVersion)) {
            throw new Error(`Storage version mismatch for ${storageKey}`);
          }
        });

        writes.forEach((write) => {
          const userId = write.userId ?? '';
          storage.set(makeStorageKey(write.collection, write.key, userId), {
            collection: write.collection,
            key: write.key,
            userId,
            version: nextVersion(),
            value: write.value,
          });
        });
      },
    ),
    leaderboardCreate: jest.fn(
      (
        leaderboardId: string,
        authoritative: boolean,
        sortOrder: 'asc' | 'desc',
      ) => {
        if (leaderboards.has(leaderboardId)) {
          return;
        }

        leaderboards.set(leaderboardId, {
          authoritative,
          sortOrder,
          records: new Map<string, LeaderboardRecordValue>(),
        });
      },
    ),
    leaderboardRecordWrite: jest.fn(
      (
        leaderboardId: string,
        ownerId: string,
        username: string,
        score: number,
        subscore: number,
        metadata: Record<string, unknown>,
      ) => {
        const leaderboard = getLeaderboardState(leaderboardId);
        const previous = leaderboard.records.get(ownerId);
        const now = new Date().toISOString();
        const record: LeaderboardRecordValue = {
          ownerId,
          username,
          score,
          subscore,
          metadata,
          createTime: previous?.createTime ?? now,
          updateTime: now,
        };

        leaderboard.records.set(ownerId, record);
        return buildLeaderboardRecord(leaderboardId, record);
      },
    ),
    leaderboardRecordsList: jest.fn(
      (
        leaderboardId: string,
        ownerIds: string[] = [],
        limit = 10,
        cursor = '',
      ) => {
        const ranked = buildRankedRecords(leaderboardId);
        const start = cursor ? Number(cursor) : 0;
        const page = ranked.slice(start, start + limit);

        return {
          records: page.map((record) => buildLeaderboardRecord(leaderboardId, record)),
          ownerRecords: ownerIds
            .map((ownerId) => {
              const record = getLeaderboardState(leaderboardId).records.get(ownerId);
              return record ? buildLeaderboardRecord(leaderboardId, record) : null;
            })
            .filter(Boolean),
          nextCursor: start + limit < ranked.length ? String(start + limit) : null,
          prevCursor: start > 0 ? String(Math.max(0, start - limit)) : null,
        };
      },
    ),
    leaderboardRecordsHaystack: jest.fn((leaderboardId: string, ownerId: string, limit = 11) => {
      const ranked = buildRankedRecords(leaderboardId);
      const ownerIndex = ranked.findIndex((record) => record.ownerId === ownerId);
      if (ownerIndex < 0) {
        return { records: [] };
      }

      const half = Math.floor(limit / 2);
      let start = Math.max(0, ownerIndex - half);
      let end = Math.min(ranked.length, start + limit);
      start = Math.max(0, end - limit);

      return {
        records: ranked.slice(start, end).map((record) => buildLeaderboardRecord(leaderboardId, record)),
      };
    }),
  };

  return {
    storage,
    leaderboards,
    nk,
  };
};

const seedCompletedUsernameProfile = (
  storage: Map<string, StoredObject>,
  userId: string,
  usernameDisplay: string,
) => {
  storage.set(makeStorageKey('user_profile', 'profile', userId), {
    collection: 'user_profile',
    key: 'profile',
    userId,
    version: `seed-${userId}`,
    value: {
      userId,
      usernameDisplay,
      usernameCanonical: usernameDisplay.toLowerCase(),
      onboardingComplete: true,
      authProvider: 'google',
      createdAt: '2026-03-21T12:00:00.000Z',
      updatedAt: '2026-03-21T12:00:00.000Z',
    },
  });
};

describe('backend Elo runtime', () => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('seeds a default Elo profile and leaderboard record for the current player', () => {
    const { storage, nk } = createRuntime();
    seedCompletedUsernameProfile(storage, 'user-1', 'Michel');
    ensureEloLeaderboard(nk, logger);

    const response = JSON.parse(rpcGetMyRatingProfile({ userId: 'user-1' }, logger, nk, ''));

    expect(response).toEqual(
      expect.objectContaining({
        leaderboardId: 'elo_global',
        userId: 'user-1',
        usernameDisplay: 'Michel',
        eloRating: 1200,
        ratedGames: 0,
        ratedWins: 0,
        ratedLosses: 0,
        provisional: true,
        rank: 1,
      }),
    );

    expect(storage.get(makeStorageKey('elo_profiles', 'profile', 'user-1'))?.value).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        usernameDisplay: 'Michel',
        eloRating: 1200,
      }),
    );
  });

  it('processes ranked match results once and returns duplicate results idempotently', () => {
    const { storage, nk } = createRuntime();
    seedCompletedUsernameProfile(storage, 'user-1', 'Michel');
    seedCompletedUsernameProfile(storage, 'user-2', 'RoyalTwo');
    ensureEloLeaderboard(nk, logger);

    const first = processRankedMatchResult(nk, logger, {
      matchId: 'ranked-match-1',
      winnerUserId: 'user-1',
      loserUserId: 'user-2',
      ranked: true,
      privateMatch: false,
      botMatch: false,
      casualMatch: false,
      experimentalMode: false,
    });
    const second = processRankedMatchResult(nk, logger, {
      matchId: 'ranked-match-1',
      winnerUserId: 'user-1',
      loserUserId: 'user-2',
      ranked: true,
      privateMatch: false,
      botMatch: false,
      casualMatch: false,
      experimentalMode: false,
    });

    expect(first).not.toBeNull();
    expect(first?.duplicate).toBe(false);
    expect(first?.record.playerResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'user-1',
          oldRating: 1200,
          newRating: 1220,
          delta: 20,
          ratedWins: 1,
          ratedLosses: 0,
        }),
        expect.objectContaining({
          userId: 'user-2',
          oldRating: 1200,
          newRating: 1180,
          delta: -20,
          ratedWins: 0,
          ratedLosses: 1,
        }),
      ]),
    );
    expect(second?.duplicate).toBe(true);
    expect(second?.record.playerResults).toEqual(first?.record.playerResults);
    expect(storage.get(makeStorageKey('elo_match_results', 'ranked-match-1', SYSTEM_USER_ID))?.value).toEqual(
      expect.objectContaining({
        matchId: 'ranked-match-1',
        winnerUserId: 'user-1',
        loserUserId: 'user-2',
      }),
    );
  });

  it('lists top Elo players and returns a leaderboard slice around the current player', () => {
    const { storage, nk } = createRuntime();
    seedCompletedUsernameProfile(storage, 'user-1', 'Michel');
    seedCompletedUsernameProfile(storage, 'user-2', 'RoyalTwo');
    seedCompletedUsernameProfile(storage, 'user-3', 'RoyalThree');
    ensureEloLeaderboard(nk, logger);

    processRankedMatchResult(nk, logger, {
      matchId: 'ranked-match-1',
      winnerUserId: 'user-1',
      loserUserId: 'user-2',
      ranked: true,
      privateMatch: false,
      botMatch: false,
      casualMatch: false,
      experimentalMode: false,
    });
    processRankedMatchResult(nk, logger, {
      matchId: 'ranked-match-2',
      winnerUserId: 'user-1',
      loserUserId: 'user-3',
      ranked: true,
      privateMatch: false,
      botMatch: false,
      casualMatch: false,
      experimentalMode: false,
    });

    const topResponse = JSON.parse(
      rpcListTopEloPlayers(
        { userId: 'user-1' },
        logger,
        nk,
        JSON.stringify({ limit: 3 }),
      ),
    );
    const aroundMeResponse = JSON.parse(
      rpcGetEloLeaderboardAroundMe(
        { userId: 'user-2' },
        logger,
        nk,
        JSON.stringify({ limit: 3 }),
      ),
    );

    expect(topResponse.records[0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        usernameDisplay: 'Michel',
      }),
    );
    expect(topResponse.records).toHaveLength(3);
    expect(aroundMeResponse.records.some((entry: { userId: string }) => entry.userId === 'user-2')).toBe(true);
  });
});

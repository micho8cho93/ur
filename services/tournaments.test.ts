import {
  getPublicTournament,
  getPublicTournamentStatus,
  getPublicTournamentStandings,
  joinPublicTournament,
  launchTournamentMatch,
  listPublicTournaments,
} from '@/services/tournaments';

const mockRpc = jest.fn();
const mockEnsureAuthenticatedDevice = jest.fn();

jest.mock('@/services/nakama', () => ({
  nakamaService: {
    ensureAuthenticatedDevice: (...args: unknown[]) => mockEnsureAuthenticatedDevice(...args),
    getClient: () => ({
      rpc: (...args: unknown[]) => mockRpc(...args),
    }),
  },
}));

describe('tournament rpc parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureAuthenticatedDevice.mockResolvedValue({
      user_id: 'user-1',
      token: 'token',
      refresh_token: 'refresh',
    });
  });

  it('parses public tournament list payloads returned as JSON strings', async () => {
    mockRpc.mockResolvedValue({
      payload: JSON.stringify({
        tournaments: [
          {
            runId: 'spring-open',
            tournamentId: 'spring-open',
            name: 'Spring Open',
            description: 'A public run.',
            lifecycle: 'open',
            startAt: '2026-03-27T10:00:00.000Z',
            updatedAt: '2026-03-27T10:00:00.000Z',
            entrants: 8,
            maxEntrants: 16,
            gameMode: 'standard',
            region: 'Global',
            buyInLabel: 'Free',
            prizeLabel: 'No prize listed',
            membership: {
              isJoined: false,
              joinedAt: null,
            },
          },
        ],
      }),
    });

    await expect(listPublicTournaments()).resolves.toEqual([
      expect.objectContaining({
        runId: 'spring-open',
        tournamentId: 'spring-open',
        name: 'Spring Open',
        membership: expect.objectContaining({
          isJoined: false,
        }),
      }),
    ]);
  });

  it('parses tournament detail, standings, join, and launch payloads', async () => {
    mockRpc
      .mockResolvedValueOnce({
        payload: {
          tournament: {
            runId: 'spring-open',
            tournamentId: 'spring-open',
            name: 'Spring Open',
            description: 'A public run.',
            lifecycle: 'open',
            startAt: '2026-03-27T10:00:00.000Z',
            updatedAt: '2026-03-27T10:00:00.000Z',
            entrants: 8,
            maxEntrants: 16,
            gameMode: 'standard',
            region: 'Global',
            buyInLabel: 'Free',
            prizeLabel: 'No prize listed',
            membership: {
              isJoined: false,
              joinedAt: null,
            },
          },
        },
      })
      .mockResolvedValueOnce({
        payload: JSON.stringify({
          standings: {
            records: [
              {
                rank: 1,
                ownerId: 'user-2',
                username: 'royal-user',
                score: 9,
                subscore: 3,
                numScore: 2,
                maxNumScore: 3,
                metadata: {
                  round: 2,
                  result: 'win',
                },
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        payload: JSON.stringify({
          joined: true,
          tournament: {
            runId: 'spring-open',
            tournamentId: 'spring-open',
            name: 'Spring Open',
            description: 'A public run.',
            lifecycle: 'open',
            startAt: '2026-03-27T10:00:00.000Z',
            updatedAt: '2026-03-27T10:10:00.000Z',
            entrants: 9,
            maxEntrants: 16,
            gameMode: 'standard',
            region: 'Global',
            buyInLabel: 'Free',
            prizeLabel: 'No prize listed',
            membership: {
              isJoined: true,
              joinedAt: '2026-03-27T10:10:00.000Z',
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        payload: JSON.stringify({
          matchId: 'match-99',
          tournamentRunId: 'spring-open',
          tournamentId: 'spring-open',
          tournamentRound: 3,
          tournamentEntryId: 'quarter-final-2',
          playerState: 'advancing',
          nextRoundReady: true,
          status: {
            queueStatus: 'matched',
            statusMessage: 'Opponent found.',
          },
        }),
      });

    await expect(getPublicTournament('spring-open')).resolves.toEqual(
      expect.objectContaining({
        runId: 'spring-open',
        name: 'Spring Open',
      }),
    );

    await expect(getPublicTournamentStandings('spring-open')).resolves.toEqual([
      expect.objectContaining({
        ownerId: 'user-2',
        round: 2,
        result: 'win',
      }),
    ]);

    await expect(joinPublicTournament('spring-open')).resolves.toEqual(
      expect.objectContaining({
        joined: true,
        tournament: expect.objectContaining({
          entrants: 9,
          membership: expect.objectContaining({
            isJoined: true,
          }),
        }),
      }),
    );

    await expect(launchTournamentMatch('spring-open')).resolves.toEqual(
      expect.objectContaining({
        matchId: 'match-99',
        tournamentRunId: 'spring-open',
        tournamentId: 'spring-open',
        tournamentRound: 3,
        tournamentEntryId: 'quarter-final-2',
        playerState: 'advancing',
        nextRoundReady: true,
        queueStatus: 'matched',
        statusMessage: 'Opponent found.',
        userId: 'user-1',
      }),
    );
  });

  it('fetches tournament detail and standings together through the combined helper', async () => {
    mockRpc
      .mockResolvedValueOnce({
        payload: {
          tournament: {
            runId: 'spring-open',
            tournamentId: 'spring-open',
            name: 'Spring Open',
            description: 'A public run.',
            lifecycle: 'open',
            startAt: '2026-03-27T10:00:00.000Z',
            updatedAt: '2026-03-27T10:00:00.000Z',
            entrants: 8,
            maxEntrants: 16,
            gameMode: 'standard',
            region: 'Global',
            buyInLabel: 'Free',
            prizeLabel: 'No prize listed',
            membership: {
              isJoined: true,
              joinedAt: '2026-03-27T10:10:00.000Z',
            },
          },
        },
      })
      .mockResolvedValueOnce({
        payload: JSON.stringify({
          standings: {
            records: [
              {
                rank: 4,
                ownerId: 'user-1',
                username: 'Michel',
                score: 4,
                subscore: 1,
                numScore: 2,
                maxNumScore: 3,
                metadata: {
                  matchId: 'match-44',
                  round: 2,
                  result: 'win',
                },
              },
            ],
          },
        }),
      });

    await expect(getPublicTournamentStatus('spring-open')).resolves.toEqual({
      tournament: expect.objectContaining({
        runId: 'spring-open',
        membership: expect.objectContaining({
          isJoined: true,
        }),
      }),
      standings: [
        expect.objectContaining({
          ownerId: 'user-1',
          matchId: 'match-44',
          round: 2,
        }),
      ],
    });
  });

  it('surfaces backend messages for tournament rpc failures', async () => {
    mockRpc.mockRejectedValue({
      status: 500,
      statusText: 'Internal Server Error',
      message: 'This tournament is already full.',
    });

    await expect(joinPublicTournament('spring-open')).rejects.toThrow('This tournament is already full.');
  });
});
